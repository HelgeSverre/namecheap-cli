import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { unallotWhoisGuard } from '../../lib/api/whoisguard.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const unallotCommand = new Command('unallot')
  .description('Remove WhoisGuard from a domain')
  .argument('<whoisguard-id>', 'WhoisGuard subscription ID')
  .option('-y, --yes', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .action(async (whoisguardId: string, options: OutputOptions & { yes?: boolean }) => {
    try {
      const client = getClient();

      // Confirm unallotting
      if (!options.yes) {
        console.log(
          chalk.yellow('Warning:'),
          'This will remove WhoisGuard protection from the domain.',
        );
        const confirmed = await confirm({
          message: `Remove WhoisGuard ${whoisguardId} from its domain?`,
          default: false,
        });

        if (!confirmed) {
          console.log(chalk.dim('Cancelled.'));
          return;
        }
      }

      await withSpinner(`Removing WhoisGuard ${whoisguardId}...`, async () => {
        return unallotWhoisGuard(client, whoisguardId);
      });

      if (options.json) {
        output({ unallotted: true, whoisguardId }, options);
      } else {
        success(`WhoisGuard ${whoisguardId} removed from domain`);
      }
    } catch (error) {
      handleError(error);
    }
  });
