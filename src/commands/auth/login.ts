import chalk from 'chalk';
import { Command } from 'commander';
import { NamecheapClient } from '../../lib/api/client.js';
import { setCredentials, setSandboxMode } from '../../lib/config.js';
import { info, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { promptAuthCredentials, promptConfirm } from '../../utils/prompts.js';
import { withSpinner } from '../../utils/spinner.js';

export const loginCommand = new Command('login')
  .description('Authenticate with Namecheap API')
  .option('--api-user <user>', 'API username')
  .option('--api-key <key>', 'API key')
  .option('--username <user>', 'Namecheap username (defaults to API user)')
  .option('--client-ip <ip>', 'Your whitelisted IP address')
  .option('--sandbox', 'Use sandbox environment for testing')
  .action(async (options) => {
    try {
      let credentials;

      // Check if all credentials provided via CLI
      if (options.apiUser && options.apiKey && options.clientIp) {
        credentials = {
          apiUser: options.apiUser,
          apiKey: options.apiKey,
          userName: options.username || options.apiUser,
          clientIp: options.clientIp,
        };
      } else {
        // Interactive prompt
        credentials = await promptAuthCredentials();
      }

      // Ask about sandbox mode if not specified
      let useSandbox = options.sandbox;
      if (useSandbox === undefined) {
        useSandbox = await promptConfirm('Use sandbox environment for testing?', false);
      }

      // Validate credentials by making a test API call
      await withSpinner('Validating credentials...', async () => {
        const client = new NamecheapClient(credentials, useSandbox);
        const response = await client.request('namecheap.users.getBalances');

        if (!response.success) {
          throw new Error(response.errors.map((e) => e.message).join(', '));
        }
      });

      // Save credentials
      setCredentials(credentials);
      setSandboxMode(useSandbox);

      success('Successfully authenticated with Namecheap');
      if (useSandbox) {
        info('Using sandbox environment');
      }
      console.log(chalk.dim(`\nCredentials saved to config file.`));
    } catch (error) {
      handleError(error);
    }
  });
