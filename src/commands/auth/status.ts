import chalk from 'chalk';
import { Command } from 'commander';
import { NamecheapClient } from '../../lib/api/client.js';
import { getConfigPath, getCredentials, isAuthenticated, isSandboxMode } from '../../lib/config.js';
import { dim, error, info, outputJson, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface BalanceResult {
  UserGetBalancesResult?: {
    '@_Currency': string;
    '@_AvailableBalance': number;
    '@_AccountBalance': number;
  };
}

export const statusCommand = new Command('status')
  .description('Check authentication status and account info')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      if (!isAuthenticated()) {
        if (options.json) {
          outputJson({ authenticated: false });
        } else {
          error('Not authenticated');
          dim('Run "namecheap auth login" to authenticate');
        }
        process.exit(1);
      }

      const credentials = getCredentials()!;
      const sandbox = isSandboxMode();

      if (options.json) {
        // Try to get balance for full status
        try {
          const client = new NamecheapClient();
          const response = await client.request<BalanceResult>('namecheap.users.getBalances');

          const data = NamecheapClient.handleResponse(response);
          const balance = data.UserGetBalancesResult;

          outputJson({
            authenticated: true,
            user: credentials.userName,
            apiUser: credentials.apiUser,
            clientIp: credentials.clientIp,
            sandbox,
            configPath: getConfigPath(),
            balance: balance
              ? {
                  available: balance['@_AvailableBalance'],
                  total: balance['@_AccountBalance'],
                  currency: balance['@_Currency'],
                }
              : null,
          });
        } catch {
          outputJson({
            authenticated: true,
            user: credentials.userName,
            apiUser: credentials.apiUser,
            clientIp: credentials.clientIp,
            sandbox,
            configPath: getConfigPath(),
            balance: null,
          });
        }
        return;
      }

      success('Authenticated');
      console.log();
      console.log(`  ${chalk.dim('User:')}      ${credentials.userName}`);
      console.log(`  ${chalk.dim('API User:')} ${credentials.apiUser}`);
      console.log(`  ${chalk.dim('Client IP:')} ${credentials.clientIp}`);
      console.log(
        `  ${chalk.dim('Mode:')}      ${sandbox ? chalk.yellow('Sandbox') : chalk.green('Production')}`,
      );
      console.log();

      // Try to fetch and display account balance
      try {
        const balance = await withSpinner('Fetching account info...', async () => {
          const client = new NamecheapClient();
          const response = await client.request<BalanceResult>('namecheap.users.getBalances');
          const data = NamecheapClient.handleResponse(response);
          return data.UserGetBalancesResult;
        });

        if (balance) {
          console.log(
            `  ${chalk.dim('Balance:')}   ${balance['@_Currency']} ${balance['@_AvailableBalance'].toFixed(2)}`,
          );
        }
      } catch {
        info('Could not fetch account balance');
      }

      console.log();
      dim(`Config: ${getConfigPath()}`);
    } catch (err) {
      handleError(err);
    }
  });
