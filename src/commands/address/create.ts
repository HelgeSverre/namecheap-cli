import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { createAddress, type AddressInput } from '../../lib/api/address.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

interface CreateOptions extends OutputOptions {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  default?: boolean;
  jobTitle?: string;
  organization?: string;
  address2?: string;
  stateChoice?: string;
  phoneExt?: string;
  fax?: string;
}

export const createCommand = new Command('create')
  .description('Create a new address')
  .requiredOption('--name <name>', 'Address name')
  .requiredOption('--email <email>', 'Email address')
  .requiredOption('--first-name <firstName>', 'First name')
  .requiredOption('--last-name <lastName>', 'Last name')
  .requiredOption('--address1 <address1>', 'Address line 1')
  .requiredOption('--city <city>', 'City')
  .requiredOption('--state <state>', 'State/Province')
  .requiredOption('--zip <zip>', 'ZIP/Postal code')
  .requiredOption('--country <country>', 'Country code (e.g., US, CA)')
  .requiredOption('--phone <phone>', 'Phone number (e.g., +1.5555551234)')
  .option('--default', 'Set as default address')
  .option('--job-title <jobTitle>', 'Job title')
  .option('--organization <organization>', 'Organization name')
  .option('--address2 <address2>', 'Address line 2')
  .option('--state-choice <stateChoice>', 'State choice (defaults to --state value)')
  .option('--phone-ext <phoneExt>', 'Phone extension')
  .option('--fax <fax>', 'Fax number')
  .option('--json', 'Output as JSON')
  .action(async (options: CreateOptions) => {
    try {
      const client = getClient();

      const input: AddressInput = {
        name: options.name,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        address1: options.address1,
        city: options.city,
        stateProvince: options.state,
        stateProvinceChoice: options.stateChoice || options.state,
        zip: options.zip,
        country: options.country,
        phone: options.phone,
        default: options.default,
        jobTitle: options.jobTitle,
        organization: options.organization,
        address2: options.address2,
        phoneExt: options.phoneExt,
        fax: options.fax,
      };

      const result = await withSpinner('Creating address...', async () => {
        return createAddress(client, input);
      });

      if (options.json) {
        output(result, options);
      } else {
        success(`Address "${result.addressName}" created with ID ${result.addressId}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
