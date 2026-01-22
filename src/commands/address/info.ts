import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getAddressInfo } from '../../lib/api/address.js';
import { output, type OutputOptions } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const infoCommand = new Command('info')
  .description('Get details of a saved address')
  .argument('<id>', 'Address ID')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: OutputOptions) => {
    try {
      const client = getClient();

      const address = await withSpinner('Fetching address info...', async () => {
        return getAddressInfo(client, id);
      });

      if (options.json) {
        output(address, options);
      } else {
        const rows: [string, string][] = [
          ['ID', address.id],
          ['Name', address.name],
          ['Default', address.default ? chalk.green('Yes') : 'No'],
          ['First Name', address.firstName],
          ['Last Name', address.lastName],
          ['Email', address.email],
          ['Job Title', address.jobTitle || chalk.dim('N/A')],
          ['Organization', address.organization || chalk.dim('N/A')],
          ['Address 1', address.address1],
          ['Address 2', address.address2 || chalk.dim('N/A')],
          ['City', address.city],
          ['State/Province', address.stateProvince],
          ['State Choice', address.stateProvinceChoice],
          ['ZIP', address.zip],
          ['Country', address.country],
          ['Phone', address.phone],
          ['Phone Ext', address.phoneExt || chalk.dim('N/A')],
          ['Fax', address.fax || chalk.dim('N/A')],
        ];

        console.log();
        for (const [label, value] of rows) {
          console.log(`${chalk.dim(label + ':')} ${value}`);
        }
      }
    } catch (error) {
      handleError(error);
    }
  });
