import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { updateUser, type UserUpdateInput } from '../../lib/api/users.js';
import { output, success, type OutputOptions } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface UpdateOptions extends OutputOptions {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  jobTitle?: string;
  organization?: string;
  address2?: string;
  phoneExt?: string;
  fax?: string;
}

export const updateCommand = new Command('update')
  .description('Update user account information')
  .requiredOption('--email <email>', 'Email address')
  .requiredOption('--first-name <name>', 'First name')
  .requiredOption('--last-name <name>', 'Last name')
  .requiredOption('--address1 <address>', 'Address line 1')
  .requiredOption('--city <city>', 'City')
  .requiredOption('--state <state>', 'State/Province')
  .requiredOption('--zip <zip>', 'Postal/ZIP code')
  .requiredOption('--country <country>', 'Country code (e.g., US, GB)')
  .requiredOption('--phone <phone>', 'Phone number')
  .option('--job-title <title>', 'Job title')
  .option('--organization <org>', 'Organization name')
  .option('--address2 <address>', 'Address line 2')
  .option('--phone-ext <ext>', 'Phone extension')
  .option('--fax <fax>', 'Fax number')
  .option('--json', 'Output as JSON')
  .action(async (options: UpdateOptions) => {
    try {
      const client = getClient();

      const input: UserUpdateInput = {
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        address1: options.address1,
        city: options.city,
        stateProvince: options.state,
        zip: options.zip,
        country: options.country,
        phone: options.phone,
        jobTitle: options.jobTitle,
        organization: options.organization,
        address2: options.address2,
        phoneExt: options.phoneExt,
        fax: options.fax,
      };

      const result = await withSpinner('Updating user information...', async () => {
        return updateUser(client, input);
      });

      if (options.json) {
        output(result, options);
      } else {
        success(`User updated successfully (ID: ${result.userId})`);
      }
    } catch (error) {
      handleError(error);
    }
  });
