import chalk from 'chalk';
import { Command } from 'commander';
import { NamecheapClient } from '../../lib/api/client.js';
import { getConfigPath, setCredentials, setSandboxMode } from '../../lib/config.js';
import { info, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { detectPublicIp, promptAuthCredentials } from '../../utils/prompts.js';
import { withSpinner } from '../../utils/spinner.js';

export const loginCommand = new Command('login')
  .description('Authenticate with Namecheap API')
  .option('--api-user <user>', 'API username')
  .option('--api-key <key>', 'API key')
  .option('--username <user>', 'Namecheap username (if different from API user)')
  .option('--client-ip <ip>', 'Your whitelisted IP address (auto-detected if not provided)')
  .option('--sandbox', 'Use sandbox environment')
  .option('--no-sandbox', 'Use production environment')
  .action(async (options) => {
    try {
      let credentials;
      let useSandbox: boolean;

      // Check if credentials provided via CLI flags
      if (options.apiUser && options.apiKey) {
        // Auto-detect IP if not provided
        let clientIp = options.clientIp;
        if (!clientIp) {
          clientIp = await withSpinner('Detecting public IP...', async () => {
            const ip = await detectPublicIp();
            if (!ip) {
              throw new Error(
                'Could not detect public IP. Please provide --client-ip manually.',
              );
            }
            return ip;
          });
        }

        credentials = {
          apiUser: options.apiUser,
          apiKey: options.apiKey,
          userName: options.username || options.apiUser,
          clientIp,
        };
        useSandbox = options.sandbox ?? false;
      } else {
        // Interactive prompt
        const result = await promptAuthCredentials({
          usernameOverride: options.username,
        });
        credentials = result.credentials;
        useSandbox = options.sandbox ?? result.sandbox;
      }

      // Validate credentials by making a test API call
      await withSpinner('Validating credentials...', async () => {
        const client = new NamecheapClient(credentials, useSandbox);
        const response = await client.request('namecheap.users.getBalances');

        if (!response.success) {
          throw new Error(response.errors.map((e) => e.message).join(', '));
        }
      });

      // Save credentials and settings
      setCredentials(credentials);
      setSandboxMode(useSandbox);

      success('Successfully authenticated with Namecheap');
      if (useSandbox) {
        info('Using sandbox environment');
      }
      console.log(chalk.dim(`Config saved to ${getConfigPath()}`));
    } catch (error) {
      handleError(error);
    }
  });
