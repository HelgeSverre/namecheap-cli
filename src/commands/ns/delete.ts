import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { deleteChildNameserver } from '../../lib/api/ns.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const deleteCommand = new Command('delete')
  .description('Delete a child nameserver (glue record)')
  .argument('<domain>', 'Domain name')
  .argument('<nameserver>', 'Nameserver hostname to delete')
  .option('-y, --yes', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .action(
    async (domain: string, nameserver: string, options: OutputOptions & { yes?: boolean }) => {
      try {
        validateDomain(domain);

        const client = getClient();

        // Confirm deletion
        if (!options.yes) {
          const confirmed = await confirm({
            message: `Delete nameserver ${nameserver}?`,
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Deletion cancelled.'));
            return;
          }
        }

        await withSpinner(`Deleting nameserver ${nameserver}...`, async () => {
          return deleteChildNameserver(client, domain, nameserver);
        });

        if (options.json) {
          output({ deleted: true, nameserver, domain }, options);
        } else {
          success(`Child nameserver deleted: ${nameserver}`);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
