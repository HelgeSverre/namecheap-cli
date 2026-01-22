import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { deleteAddress } from '../../lib/api/address.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const deleteCommand = new Command('delete')
  .description('Delete a saved address')
  .argument('<id>', 'Address ID to delete')
  .option('--force', 'Skip confirmation prompt')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: OutputOptions & { force?: boolean }) => {
    try {
      const client = getClient();

      if (!options.force) {
        console.log(chalk.yellow('Warning:'), 'This will permanently delete the address.');
        const confirmed = await confirm({
          message: `Delete address ${id}?`,
          default: false,
        });

        if (!confirmed) {
          console.log(chalk.dim('Cancelled.'));
          return;
        }
      }

      const result = await withSpinner('Deleting address...', async () => {
        return deleteAddress(client, id);
      });

      if (options.json) {
        output({ deleted: true, addressId: id, ...result }, options);
      } else {
        success(`Address ${id} deleted`);
      }
    } catch (error) {
      handleError(error);
    }
  });
