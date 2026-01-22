import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getAddressList } from '../../lib/api/address.js';
import { output, type OutputOptions, outputTable } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List saved addresses')
  .option('--json', 'Output as JSON')
  .action(async (options: OutputOptions) => {
    try {
      const client = getClient();

      const result = await withSpinner('Fetching addresses...', async () => {
        return getAddressList(client);
      });

      if (result.items.length === 0) {
        console.log(chalk.dim('No addresses found.'));
        return;
      }

      if (options.json) {
        output(result.items, options);
      } else {
        outputTable(
          ['ID', 'Name'],
          result.items.map((item) => [chalk.dim(item.id), item.name]),
        );
      }
    } catch (error) {
      handleError(error);
    }
  });
