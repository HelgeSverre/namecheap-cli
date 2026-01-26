import chalk from 'chalk';
import { Command } from 'commander';
import { createProgram } from '../../cli.js';
import {
  detectShell,
  getCompletionPath,
  installCompletion,
  uninstallCompletion,
  type Shell,
} from '../../completions/install.js';
import { commandToNode } from '../../completions/model.js';
import { renderBash, renderFish, renderZsh } from '../../completions/renderers.js';

function generateCompletion(shell: Shell): string {
  const program = createProgram({ includeCompletions: false });
  const tree = commandToNode(program);

  switch (shell) {
    case 'bash':
      return renderBash(tree);
    case 'zsh':
      return renderZsh(tree);
    case 'fish':
      return renderFish(tree);
  }
}

function isValidShell(shell: string): shell is Shell {
  return ['bash', 'zsh', 'fish'].includes(shell);
}

const printCommand = new Command('print')
  .description('Print shell completion script to stdout')
  .argument('<shell>', 'Shell type: bash, zsh, or fish')
  .action((shell: string) => {
    const shellLower = shell.toLowerCase();

    if (!isValidShell(shellLower)) {
      console.error(`Unknown shell: ${shell}`);
      console.error('Supported shells: bash, zsh, fish');
      process.exit(1);
    }

    console.log(generateCompletion(shellLower));
  });

const installCommand = new Command('install')
  .description('Install shell completions')
  .option('--shell <shell>', 'Shell type: bash, zsh, or fish (auto-detected if not specified)')
  .option('--force', 'Overwrite existing completion file')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('--homebrew', 'Install to Homebrew directories (macOS only)')
  .action((options: { shell?: string; force?: boolean; dryRun?: boolean; homebrew?: boolean }) => {
    let shell: Shell;

    if (options.shell) {
      const shellLower = options.shell.toLowerCase();
      if (!isValidShell(shellLower)) {
        console.error(`Unknown shell: ${options.shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
      }
      shell = shellLower;
    } else {
      const detected = detectShell();
      if (!detected) {
        console.error('Could not detect shell from $SHELL environment variable.');
        console.error('Please specify the shell with --shell bash|zsh|fish');
        process.exit(1);
      }
      shell = detected;
      console.log(chalk.dim(`Detected shell: ${shell}`));
    }

    const content = generateCompletion(shell);
    const result = installCompletion(shell, content, {
      force: options.force,
      dryRun: options.dryRun,
      homebrew: options.homebrew,
    });

    if (!result.success) {
      console.error(chalk.red('Error:'), result.error);
      process.exit(1);
    }

    if (options.dryRun) {
      console.log(chalk.yellow('Dry run mode - no changes made:\n'));
    } else {
      console.log(chalk.green('✓'), `Completions installed to: ${result.path}`);
      console.log();
    }

    if (result.instructions) {
      for (const line of result.instructions) {
        console.log(line);
      }
    }
  });

const uninstallCommand = new Command('uninstall')
  .description('Uninstall shell completions')
  .option('--shell <shell>', 'Shell type: bash, zsh, or fish (auto-detected if not specified)')
  .action((options: { shell?: string }) => {
    let shell: Shell;

    if (options.shell) {
      const shellLower = options.shell.toLowerCase();
      if (!isValidShell(shellLower)) {
        console.error(`Unknown shell: ${options.shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
      }
      shell = shellLower;
    } else {
      const detected = detectShell();
      if (!detected) {
        console.error('Could not detect shell from $SHELL environment variable.');
        console.error('Please specify the shell with --shell bash|zsh|fish');
        process.exit(1);
      }
      shell = detected;
    }

    const result = uninstallCompletion(shell);

    if (!result.success) {
      console.error(chalk.red('Error:'), result.error);
      process.exit(1);
    }

    console.log(chalk.green('✓'), `Completions removed from: ${result.path}`);
    if (result.instructions) {
      console.log();
      for (const line of result.instructions) {
        console.log(line);
      }
    }
  });

const pathCommand = new Command('path')
  .description('Show where completions would be installed')
  .option('--shell <shell>', 'Shell type: bash, zsh, or fish (auto-detected if not specified)')
  .action((options: { shell?: string }) => {
    let shell: Shell;

    if (options.shell) {
      const shellLower = options.shell.toLowerCase();
      if (!isValidShell(shellLower)) {
        console.error(`Unknown shell: ${options.shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
      }
      shell = shellLower;
    } else {
      const detected = detectShell();
      if (!detected) {
        console.error('Could not detect shell from $SHELL environment variable.');
        console.error('Please specify the shell with --shell bash|zsh|fish');
        process.exit(1);
      }
      shell = detected;
    }

    console.log(getCompletionPath(shell));
  });

export const completionsCommand = new Command('completions')
  .description('Generate and manage shell completion scripts')
  .argument('[shell]', 'Shell type: bash, zsh, or fish (for backwards compatibility)')
  .action((shell?: string) => {
    if (shell) {
      const shellLower = shell.toLowerCase();
      if (!isValidShell(shellLower)) {
        console.error(`Unknown shell: ${shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
      }
      console.log(generateCompletion(shellLower));
    } else {
      completionsCommand.help();
    }
  })
  .addCommand(printCommand)
  .addCommand(installCommand)
  .addCommand(uninstallCommand)
  .addCommand(pathCommand);
