import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { loginUser } from '../../lib/api/users.js';
import { output, success, error as outputError, type OutputOptions } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface LoginOptions extends OutputOptions {
  password: string;
}

export const loginCommand = new Command('login')
  .description('Validate login credentials for API-created users')
  .argument('<username>', 'Username to validate')
  .requiredOption('--password <password>', 'Password to validate')
  .option('--json', 'Output as JSON')
  .action(async (username: string, options: LoginOptions) => {
    try {
      const client = getClient();

      const result = await withSpinner('Validating login...', async () => {
        return loginUser(client, username, options.password);
      });

      if (options.json) {
        output(result, options);
      } else {
        if (result.loginSuccess) {
          success(`Login successful for user: ${chalk.cyan(result.username)}`);
        } else {
          outputError(`Login failed for user: ${chalk.cyan(username)}`);
          process.exitCode = 1;
        }
      }
    } catch (error) {
      handleError(error);
    }
  });
