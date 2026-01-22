import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import {
  resetPassword,
  type ResetPasswordOptions as ApiResetPasswordOptions,
} from '../../lib/api/users.js';
import { output, success, type OutputOptions } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

const FIND_BY_CHOICES = ['email', 'domain', 'username'] as const;
type FindBy = (typeof FIND_BY_CHOICES)[number];

interface ResetPasswordOptions extends OutputOptions {
  findBy: string;
  value: string;
  emailFromName?: string;
  emailFrom?: string;
  urlPattern?: string;
}

export const resetPasswordCommand = new Command('reset-password')
  .description('Request a password reset email')
  .requiredOption('--find-by <type>', `How to find the user: ${FIND_BY_CHOICES.join(', ')}`)
  .requiredOption('--value <value>', 'The email, domain, or username to lookup')
  .option('--email-from-name <name>', 'Name to use in the From field of reset email')
  .option('--email-from <email>', 'Email address to use in the From field')
  .option('--url-pattern <pattern>', 'URL pattern for the reset link')
  .option('--json', 'Output as JSON')
  .action(async (options: ResetPasswordOptions) => {
    try {
      const findBy = options.findBy.toLowerCase() as FindBy;
      if (!FIND_BY_CHOICES.includes(findBy)) {
        throw new ValidationError(
          `Invalid --find-by value: ${options.findBy}`,
          `Valid values: ${FIND_BY_CHOICES.join(', ')}`,
        );
      }

      const findByMap: Record<FindBy, ApiResetPasswordOptions['findBy']> = {
        email: 'EMAILADDRESS',
        domain: 'DOMAINNAME',
        username: 'USERNAME',
      };

      const client = getClient();

      const result = await withSpinner('Requesting password reset...', async () => {
        return resetPassword(client, {
          findBy: findByMap[findBy],
          findByValue: options.value,
          emailFromName: options.emailFromName,
          emailFrom: options.emailFrom,
          urlPattern: options.urlPattern,
        });
      });

      if (options.json) {
        output(result, options);
      } else {
        success('Password reset email sent successfully');
      }
    } catch (error) {
      handleError(error);
    }
  });
