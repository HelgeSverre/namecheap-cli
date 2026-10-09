import { existsSync, readdirSync, realpathSync, rmdirSync, unlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { getCompletionPath, type Shell } from '../completions/install.js';
import { getHomeDir } from '../utils/home.js';
import { getConfigDir, getConfigPath } from './config.js';
import { PACKAGE_NAME } from './package-info.js';

export type FootprintKind = 'config' | 'completion' | 'cache';

export interface FootprintItem {
  kind: FootprintKind;
  description: string;
  path: string;
  /** Directory to remove afterwards if (and only if) it is left empty. */
  pruneDirIfEmpty?: string;
}

export type InstallMethod = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'npx' | 'binary' | 'unknown';

export interface InstallInfo {
  method: InstallMethod;
  /** Command that removes the CLI itself, or null when there is nothing to remove. */
  command: string | null;
  note?: string;
}

const SHELLS: Shell[] = ['bash', 'zsh', 'fish'];

/**
 * Path of update-notifier's cache for this package. update-notifier stores it via
 * configstore at `$XDG_CONFIG_HOME/configstore/update-notifier-<name>.json`.
 */
export function getUpdateCheckCachePath(): string {
  const configHome = process.env.XDG_CONFIG_HOME || join(getHomeDir(), '.config');
  return join(configHome, 'configstore', `update-notifier-${PACKAGE_NAME}.json`);
}

/** Every location the CLI may have written to, whether or not it exists. */
export function getFootprintCandidates(): FootprintItem[] {
  const items: FootprintItem[] = [
    {
      kind: 'config',
      description: 'Config and stored API credentials',
      path: getConfigPath(),
      pruneDirIfEmpty: getConfigDir(),
    },
  ];

  const completionPaths = new Set<string>();
  for (const shell of SHELLS) {
    for (const homebrew of [false, true]) {
      const path = getCompletionPath(shell, { homebrew });
      if (!completionPaths.has(path)) {
        completionPaths.add(path);
        items.push({ kind: 'completion', description: `${shell} completion script`, path });
      }
    }
  }

  const cachePath = getUpdateCheckCachePath();
  items.push({
    kind: 'cache',
    description: 'Update-check cache',
    path: cachePath,
    // Scoped package names put the file in a per-scope subdirectory
    pruneDirIfEmpty: PACKAGE_NAME.includes('/') ? dirname(cachePath) : undefined,
  });

  return items;
}

/** The subset of the footprint that is actually present on disk. */
export function findFootprint(): FootprintItem[] {
  return getFootprintCandidates().filter((item) => existsSync(item.path));
}

export interface RemovalResult {
  item: FootprintItem;
  removed: boolean;
  error?: string;
}

/**
 * Remove the given files. Only the listed files are deleted; their parent
 * directory is removed afterwards only when it ends up empty, so a custom
 * NAMECHEAP_CLI_CONFIG_DIR containing other files is never wiped.
 */
export function removeFootprint(items: FootprintItem[]): RemovalResult[] {
  return items.map((item) => {
    try {
      if (existsSync(item.path)) {
        unlinkSync(item.path);
      }
      if (item.pruneDirIfEmpty && existsSync(item.pruneDirIfEmpty)) {
        if (readdirSync(item.pruneDirIfEmpty).length === 0) {
          rmdirSync(item.pruneDirIfEmpty);
        }
      }
      return { item, removed: true };
    } catch (err) {
      return { item, removed: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

/**
 * Work out how the CLI was installed from the running script and executable
 * paths, and return the command that removes it.
 */
export function detectInstallMethod(
  scriptPath: string | undefined,
  execPath: string,
  platform: NodeJS.Platform = process.platform,
): InstallInfo {
  const script = (scriptPath ?? '').replace(/\\/g, '/');

  // Bun-compiled standalone binary: the entry script lives in Bun's virtual filesystem
  if (script.startsWith('/$bunfs/') || script.includes('~BUN/')) {
    const remove = platform === 'win32' ? 'del' : 'rm';
    return {
      method: 'binary',
      command: `${remove} "${execPath}"`,
      note: 'Standalone binary: delete the executable to remove it.',
    };
  }

  if (script.includes('/_npx/') || script.includes('/.bun/install/cache/')) {
    return {
      method: 'npx',
      command: null,
      note: 'Running via npx/bunx: nothing is installed globally.',
    };
  }

  if (script.includes('/.bun/install/global/') || script.includes('/.bun/bin/')) {
    return { method: 'bun', command: `bun remove -g ${PACKAGE_NAME}` };
  }

  if (script.includes('/pnpm/global/') || script.includes('/.pnpm/')) {
    return { method: 'pnpm', command: `pnpm remove -g ${PACKAGE_NAME}` };
  }

  if (script.includes('/yarn/global/') || script.includes('/.yarn/')) {
    return { method: 'yarn', command: `yarn global remove ${PACKAGE_NAME}` };
  }

  if (script.includes(`/node_modules/${PACKAGE_NAME}/`)) {
    return { method: 'npm', command: `npm uninstall -g ${PACKAGE_NAME}` };
  }

  const runtime = basename(execPath).replace(/\.exe$/, '');
  return {
    method: 'unknown',
    command: null,
    note:
      runtime === 'node' || runtime === 'bun'
        ? `Could not tell how ${PACKAGE_NAME} was installed. Remove it with the package manager you used, e.g. npm uninstall -g ${PACKAGE_NAME}`
        : `Could not tell how ${PACKAGE_NAME} was installed.`,
  };
}

/** Detect the install method of the currently running CLI. */
export function detectCurrentInstall(): InstallInfo {
  let scriptPath = process.argv[1];
  try {
    if (scriptPath && existsSync(scriptPath)) {
      // Global bin entries are usually symlinks into the package directory
      scriptPath = realpathSync(scriptPath);
    }
  } catch {
    // Fall back to the unresolved path
  }
  return detectInstallMethod(scriptPath, process.execPath);
}
