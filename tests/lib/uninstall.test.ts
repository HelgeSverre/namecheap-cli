import { describe, expect, test, beforeEach } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getCompletionPath } from '../../src/completions/install.js';
import { getConfigDir, getConfigPath, setSandboxMode } from '../../src/lib/config.js';
import {
  detectInstallMethod,
  findFootprint,
  getFootprintCandidates,
  getUpdateCheckCachePath,
  removeFootprint,
} from '../../src/lib/uninstall.js';

const home = process.env.HOME!;

function touch(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x');
}

/** Footprint entries inside the test sandbox (excludes real Homebrew prefixes). */
function sandboxedFootprint() {
  return findFootprint().filter((item) => item.path.startsWith(home));
}

describe('uninstall footprint', () => {
  beforeEach(() => {
    rmSync(join(home, '.config'), { recursive: true, force: true });
    rmSync(join(home, '.zsh'), { recursive: true, force: true });
    rmSync(join(home, '.local'), { recursive: true, force: true });
  });

  test('candidates cover config, all shell completions and the update cache', () => {
    const paths = getFootprintCandidates().map((i) => i.path);
    expect(paths).toContain(getConfigPath());
    expect(paths).toContain(getCompletionPath('bash'));
    expect(paths).toContain(getCompletionPath('zsh'));
    expect(paths).toContain(getCompletionPath('fish'));
    expect(paths).toContain(getUpdateCheckCachePath());
  });

  test('update cache lives in configstore under the scoped package name', () => {
    expect(getUpdateCheckCachePath()).toBe(
      join(home, '.config', 'configstore', 'update-notifier-@helgesverre', 'namecheap-cli.json'),
    );
  });

  test('finds nothing on a clean machine', () => {
    expect(sandboxedFootprint()).toEqual([]);
  });

  test('finds and removes only what exists', () => {
    setSandboxMode(false); // writes config.json
    touch(getCompletionPath('zsh'));
    touch(getUpdateCheckCachePath());

    const found = sandboxedFootprint();
    expect(found.map((i) => i.kind).sort()).toEqual(['cache', 'completion', 'config']);

    const results = removeFootprint(found);
    expect(results.every((r) => r.removed)).toBe(true);

    expect(existsSync(getConfigPath())).toBe(false);
    expect(existsSync(getConfigDir())).toBe(false);
    expect(existsSync(getCompletionPath('zsh'))).toBe(false);
    expect(existsSync(getUpdateCheckCachePath())).toBe(false);
    expect(existsSync(dirname(getUpdateCheckCachePath()))).toBe(false);
    // Shared directories stay
    expect(existsSync(join(home, '.config', 'configstore'))).toBe(true);
    expect(existsSync(dirname(getCompletionPath('zsh')))).toBe(true);
  });

  test('keeps other files in the config directory', () => {
    setSandboxMode(false);
    const other = join(getConfigDir(), 'keep-me.txt');
    writeFileSync(other, 'x');

    removeFootprint(sandboxedFootprint());

    expect(existsSync(getConfigPath())).toBe(false);
    expect(existsSync(other)).toBe(true);
  });
});

describe('detectInstallMethod', () => {
  const pkg = '@helgesverre/namecheap-cli';

  test('npm global install', () => {
    const info = detectInstallMethod(
      `/usr/local/lib/node_modules/${pkg}/dist/index.js`,
      '/usr/local/bin/node',
    );
    expect(info).toEqual({ method: 'npm', command: `npm uninstall -g ${pkg}` });
  });

  test('bun global install', () => {
    const info = detectInstallMethod(
      `/Users/me/.bun/install/global/node_modules/${pkg}/dist/index.js`,
      '/Users/me/.bun/bin/bun',
    );
    expect(info.command).toBe(`bun remove -g ${pkg}`);
  });

  test('pnpm global install', () => {
    const info = detectInstallMethod(
      `/Users/me/Library/pnpm/global/5/.pnpm/${pkg.replace('/', '+')}@0.1.0/node_modules/${pkg}/dist/index.js`,
      '/usr/local/bin/node',
    );
    expect(info.command).toBe(`pnpm remove -g ${pkg}`);
  });

  test('yarn global install', () => {
    const info = detectInstallMethod(
      `/Users/me/.config/yarn/global/node_modules/${pkg}/dist/index.js`,
      '/usr/local/bin/node',
    );
    expect(info.command).toBe(`yarn global remove ${pkg}`);
  });

  test('npx has nothing to uninstall', () => {
    const info = detectInstallMethod(
      `/Users/me/.npm/_npx/abc123/node_modules/${pkg}/dist/index.js`,
      '/usr/local/bin/node',
    );
    expect(info.method).toBe('npx');
    expect(info.command).toBeNull();
  });

  test('standalone binary prints the executable path', () => {
    const info = detectInstallMethod('/$bunfs/root/namecheap', '/usr/local/bin/namecheap', 'linux');
    expect(info.method).toBe('binary');
    expect(info.command).toBe('rm "/usr/local/bin/namecheap"');
  });

  test('standalone binary on Windows', () => {
    const info = detectInstallMethod(
      'B:\\~BUN\\root\\namecheap.exe',
      'C:\\tools\\namecheap.exe',
      'win32',
    );
    expect(info.command).toBe('del "C:\\tools\\namecheap.exe"');
  });

  test('unknown install suggests npm as an example', () => {
    const info = detectInstallMethod('/home/me/code/namecheap-cli/src/index.ts', '/usr/bin/bun');
    expect(info.method).toBe('unknown');
    expect(info.command).toBeNull();
    expect(info.note).toContain(`npm uninstall -g ${pkg}`);
  });
});
