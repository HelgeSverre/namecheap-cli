import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { changePassword } from '../../lib/api/users.js';
import { output, success, type OutputOptions } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface ChangePasswordOptions extends OutputOptions {
  oldPassword?: string;
  newPassword: string;
  resetCode?: string;
}

export const changePasswordCommand = new Command('change-password')
  .description('Change user password')
  .requiredOption('--new-password <password>', 'New password')
  .option('--old-password <password>', 'Current password (for standard flow)')
  .option('--reset-code <code>', 'Password reset code (for reset flow)')
  .option('--json', 'Output as JSON')
  .action(async (options: ChangePasswordOptions) => {
    try {
      if (!options.oldPassword && !options.resetCode) {
        throw new ValidationError(
          'Either --old-password or --reset-code is required',
          'Use --old-password for standard password change, or --reset-code if you have a reset code',
        );
      }

      if (options.oldPassword && options.resetCode) {
        throw new ValidationError(
          'Cannot use both --old-password and --reset-code',
          'Use only one of these options',
        );
      }

      const client = getClient();

      const result = await withSpinner('Changing password...', async () => {
        if (options.oldPassword) {
          return changePassword(client, {
            oldPassword: options.oldPassword,
            newPassword: options.newPassword,
          });
        } else {
          return changePassword(client, {
            resetCode: options.resetCode!,
            newPassword: options.newPassword,
          });
        }
      });

      if (options.json) {
        output(result, options);
      } else {
        success(`Password changed successfully (User ID: ${result.userId})`);
      }
    } catch (error) {
      handleError(error);
    }
  });
