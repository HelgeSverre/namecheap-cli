import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getAddFundsStatus } from '../../lib/api/users.js';
import { output, statusBadge, type OutputOptions } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const fundsStatusCommand = new Command('funds-status')
  .description('Get the status of an add funds request')
  .argument('<token>', 'Token ID from add-funds request')
  .option('--json', 'Output as JSON')
  .action(async (token: string, options: OutputOptions) => {
    try {
      const client = getClient();

      const result = await withSpinner('Fetching funds status...', async () => {
        return getAddFundsStatus(client, token);
      });

      if (options.json) {
        output(result, options);
      } else {
        console.log();
        console.log(`${chalk.dim('Transaction ID:')} ${result.transactionId || chalk.dim('N/A')}`);
        console.log(`${chalk.dim('Amount:')} $${result.amount.toFixed(2)}`);
        console.log(`${chalk.dim('Status:')} ${statusBadge(result.status)}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
