import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getBalances } from '../../lib/api/users.js';
import { output, type OutputOptions } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const balancesCommand = new Command('balances')
  .description('Show account balances')
  .option('--json', 'Output as JSON')
  .action(async (options: OutputOptions) => {
    try {
      const client = getClient();

      const balances = await withSpinner('Fetching account balances...', async () => {
        return getBalances(client);
      });

      if (options.json) {
        output(balances, options);
      } else {
        const rows: [string, string][] = [
          ['Available Balance', formatCurrency(balances.availableBalance, balances.currency)],
          ['Account Balance', formatCurrency(balances.accountBalance, balances.currency)],
          ['Earned Amount', formatCurrency(balances.earnedAmount, balances.currency)],
          ['Withdrawable', formatCurrency(balances.withdrawableAmount, balances.currency)],
          ['Pending', formatCurrency(balances.pendingAmount, balances.currency)],
        ];

        console.log();
        for (const [label, value] of rows) {
          console.log(`${chalk.dim(label + ':')} ${value}`);
        }
      }
    } catch (error) {
      handleError(error);
    }
  });

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency;
  const formatted = amount.toFixed(2);

  if (amount > 0) {
    return chalk.green(`${symbol}${formatted}`);
  }
  return `${symbol}${formatted}`;
}
