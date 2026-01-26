import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type Shell = 'bash' | 'zsh' | 'fish';

export interface InstallResult {
  success: boolean;
  path?: string;
  instructions?: string[];
  error?: string;
}

export function detectShell(): Shell | null {
  const shellEnv = process.env.SHELL || '';
  const shellName = path.basename(shellEnv);

  if (shellName === 'bash') return 'bash';
  if (shellName === 'zsh') return 'zsh';
  if (shellName === 'fish') return 'fish';

  return null;
}

function getHomebrewPrefix(): string | null {
  if (process.platform !== 'darwin') return null;

  const prefixes = ['/opt/homebrew', '/usr/local'];
  for (const prefix of prefixes) {
    if (fs.existsSync(path.join(prefix, 'bin', 'brew'))) {
      return prefix;
    }
  }
  return null;
}

export function getCompletionPath(shell: Shell, options: { homebrew?: boolean } = {}): string {
  const home = os.homedir();
  const brewPrefix = getHomebrewPrefix();

  switch (shell) {
    case 'bash':
      if (options.homebrew && brewPrefix) {
        return path.join(brewPrefix, 'etc', 'bash_completion.d', 'namecheap');
      }
      return path.join(home, '.local', 'share', 'bash-completion', 'completions', 'namecheap');
    case 'zsh':
      if (options.homebrew && brewPrefix) {
        return path.join(brewPrefix, 'share', 'zsh', 'site-functions', '_namecheap');
      }
      return path.join(home, '.zsh', 'completions', '_namecheap');
    case 'fish':
      return path.join(home, '.config', 'fish', 'completions', 'namecheap.fish');
  }
}

export function getPostInstallInstructions(shell: Shell): string[] {
  switch (shell) {
    case 'bash':
      return [
        'Add to your ~/.bashrc if completions are not auto-loaded:',
        '',
        '  source ~/.local/share/bash-completion/completions/namecheap',
        '',
        'Then restart your shell or run: source ~/.bashrc',
      ];
    case 'zsh':
      return [
        'Ensure your ~/.zshrc contains:',
        '',
        '  fpath=(~/.zsh/completions $fpath)',
        '  autoload -Uz compinit && compinit',
        '',
        'Then restart your shell or run: source ~/.zshrc',
      ];
    case 'fish':
      return [
        'Fish completions are auto-loaded from ~/.config/fish/completions/',
        '',
        'Restart your shell to enable completions.',
      ];
  }
}

export function installCompletion(
  shell: Shell,
  content: string,
  options: { force?: boolean; dryRun?: boolean; homebrew?: boolean } = {},
): InstallResult {
  const targetPath = getCompletionPath(shell, { homebrew: options.homebrew });
  const targetDir = path.dirname(targetPath);

  if (options.dryRun) {
    return {
      success: true,
      path: targetPath,
      instructions: [
        `Would create directory: ${targetDir}`,
        `Would write completion script to: ${targetPath}`,
        '',
        ...getPostInstallInstructions(shell),
      ],
    };
  }

  try {
    if (fs.existsSync(targetPath) && !options.force) {
      return {
        success: false,
        path: targetPath,
        error: `Completion file already exists: ${targetPath}\nUse --force to overwrite.`,
      };
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(targetPath, content, { mode: 0o644 });

    return {
      success: true,
      path: targetPath,
      instructions: getPostInstallInstructions(shell),
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to install completion: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function uninstallCompletion(shell: Shell): InstallResult {
  const targetPath = getCompletionPath(shell);

  try {
    if (!fs.existsSync(targetPath)) {
      return {
        success: true,
        path: targetPath,
        instructions: ['Completion file does not exist, nothing to remove.'],
      };
    }

    fs.unlinkSync(targetPath);

    return {
      success: true,
      path: targetPath,
      instructions: [
        'Completion script removed.',
        'Restart your shell for changes to take effect.',
      ],
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to uninstall completion: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
