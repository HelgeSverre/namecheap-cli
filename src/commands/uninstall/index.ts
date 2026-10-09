import chalk from 'chalk';
import { Command } from 'commander';
import { outputJson, success, warning } from '../../lib/output.js';
import {
  detectCurrentInstall,
  findFootprint,
  removeFootprint,
  type FootprintItem,
  type InstallInfo,
} from '../../lib/uninstall.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { promptConfirm } from '../../utils/prompts.js';

interface UninstallOptions {
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

function printItems(heading: string, items: FootprintItem[]): void {
  console.log(heading);
  for (const item of items) {
    console.log(`  ${chalk.dim('-')} ${item.description}: ${item.path}`);
  }
  console.log();
}

function printPackageRemoval(install: InstallInfo): void {
  if (install.command) {
    console.log('To remove the CLI itself, run:');
    console.log();
    console.log(`  ${chalk.cyan(install.command)}`);
    console.log();
  }
  if (install.note) {
    console.log(chalk.dim(install.note));
  }
}

export const uninstallCommand = new Command('uninstall')
  .description('Remove stored credentials, config, shell completions and caches')
  .option('--force', 'Skip confirmation prompt')
  .option('-y, --yes', 'Skip confirmation prompt (alias for --force)')
  .option('--dry-run', 'Show what would be removed without removing anything')
  .option('--json', 'Output as JSON')
  .action(async (options: UninstallOptions) => {
    try {
      const items = findFootprint();
      const install = detectCurrentInstall();
      const skipConfirm = options.force || options.yes;

      if (options.dryRun || items.length === 0) {
        if (options.json) {
          outputJson({
            dryRun: !!options.dryRun,
            wouldRemove: items.map(({ kind, path }) => ({ kind, path })),
            packageUninstallCommand: install.command,
          });
          return;
        }
        if (items.length === 0) {
          console.log('Nothing to remove: no config, credentials, completions or caches found.\n');
        } else {
          printItems(chalk.yellow('Dry run - the following would be removed:'), items);
        }
        printPackageRemoval(install);
        return;
      }

      if (!skipConfirm) {
        if (!process.stdin.isTTY) {
          throw new ValidationError(
            'Refusing to remove files without confirmation in a non-interactive shell',
            'Re-run with --yes (or --force) to confirm',
          );
        }
        printItems('The following will be removed:', items);
        const confirmed = await promptConfirm(
          'Remove these files? Stored API credentials cannot be recovered.',
          false,
        );
        if (!confirmed) {
          warning('Operation cancelled');
          return;
        }
      }

      const results = removeFootprint(items);
      const failed = results.filter((r) => !r.removed);

      if (options.json) {
        outputJson({
          dryRun: false,
          removed: results.filter((r) => r.removed).map(({ item }) => item.path),
          failed: failed.map(({ item, error }) => ({ path: item.path, error })),
          packageUninstallCommand: install.command,
        });
      } else {
        for (const result of results) {
          if (result.removed) {
            success(`Removed ${result.item.description.toLowerCase()}: ${result.item.path}`);
          } else {
            console.error(chalk.red('✗'), `Failed to remove ${result.item.path}: ${result.error}`);
          }
        }
        console.log();
        printPackageRemoval(install);
      }

      if (failed.length > 0) {
        process.exitCode = 1;
      }
    } catch (error) {
      handleError(error);
    }
  });
