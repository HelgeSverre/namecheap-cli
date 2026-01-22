import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { createAddFundsRequest } from '../../lib/api/users.js';
import { getCredentials } from '../../lib/config.js';
import { output, type OutputOptions } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface AddFundsOptions extends OutputOptions {
  amount: string;
  returnUrl: string;
  username?: string;
}

export const addFundsCommand = new Command('add-funds')
  .description('Create a request to add funds to your account')
  .requiredOption('--amount <amount>', 'Amount to add (USD)')
  .requiredOption('--return-url <url>', 'URL to redirect to after payment')
  .option('--username <username>', 'Username (defaults to current user)')
  .option('--json', 'Output as JSON')
  .action(async (options: AddFundsOptions) => {
    try {
      const amount = parseFloat(options.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new ValidationError(
          'Amount must be a positive number',
          'Use --amount with a value like 50.00',
        );
      }

      const credentials = getCredentials();
      const username = options.username || credentials?.userName;

      if (!username) {
        throw new ValidationError(
          'Username is required',
          'Use --username or configure credentials with `namecheap auth login`',
        );
      }

      const client = getClient();

      const result = await withSpinner('Creating add funds request...', async () => {
        return createAddFundsRequest(client, {
          username,
          amount,
          returnUrl: options.returnUrl,
        });
      });

      if (options.json) {
        output(result, options);
      } else {
        console.log();
        console.log(`${chalk.dim('Token ID:')} ${result.tokenId}`);
        console.log(`${chalk.dim('Redirect URL:')} ${chalk.cyan(result.redirectUrl)}`);
        console.log();
        console.log(chalk.dim('Visit the redirect URL to complete the payment.'));
      }
    } catch (error) {
      handleError(error);
    }
  });
