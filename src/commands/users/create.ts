import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { createUser, type CreateUserInput } from '../../lib/api/users.js';
import { output, success, type OutputOptions } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface CreateOptions extends OutputOptions {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  acceptTerms: boolean;
  acceptNews?: boolean;
  jobTitle?: string;
  organization?: string;
  address2?: string;
  phoneExt?: string;
  fax?: string;
  ignoreDuplicateEmail?: boolean;
}

export const createCommand = new Command('create')
  .description('Create a new user account under your API account')
  .requiredOption('--username <username>', 'Username for the new account')
  .requiredOption('--password <password>', 'Password for the new account')
  .requiredOption('--email <email>', 'Email address')
  .requiredOption('--first-name <name>', 'First name')
  .requiredOption('--last-name <name>', 'Last name')
  .requiredOption('--address1 <address>', 'Address line 1')
  .requiredOption('--city <city>', 'City')
  .requiredOption('--state <state>', 'State/Province')
  .requiredOption('--zip <zip>', 'Postal/ZIP code')
  .requiredOption('--country <country>', 'Country code (e.g., US, GB)')
  .requiredOption('--phone <phone>', 'Phone number')
  .option('--accept-terms', 'Accept terms and conditions (required)', false)
  .option('--accept-news', 'Accept promotional emails')
  .option('--job-title <title>', 'Job title')
  .option('--organization <org>', 'Organization name')
  .option('--address2 <address>', 'Address line 2')
  .option('--phone-ext <ext>', 'Phone extension')
  .option('--fax <fax>', 'Fax number')
  .option('--ignore-duplicate-email', 'Ignore duplicate email address')
  .option('--json', 'Output as JSON')
  .action(async (options: CreateOptions) => {
    try {
      if (!options.acceptTerms) {
        throw new ValidationError(
          'You must accept the terms and conditions',
          'Use --accept-terms to accept the terms and conditions',
        );
      }

      const client = getClient();

      const input: CreateUserInput = {
        username: options.username,
        password: options.password,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        address1: options.address1,
        city: options.city,
        stateProvince: options.state,
        zip: options.zip,
        country: options.country,
        phone: options.phone,
        acceptTerms: options.acceptTerms,
        acceptNews: options.acceptNews,
        jobTitle: options.jobTitle,
        organization: options.organization,
        address2: options.address2,
        phoneExt: options.phoneExt,
        fax: options.fax,
        ignoreDuplicateEmail: options.ignoreDuplicateEmail,
      };

      const result = await withSpinner('Creating user account...', async () => {
        return createUser(client, input);
      });

      if (options.json) {
        output(result, options);
      } else {
        success(`User created successfully (ID: ${result.userId})`);
      }
    } catch (error) {
      handleError(error);
    }
  });
