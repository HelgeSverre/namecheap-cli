import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { setDefaultAddress } from '../../lib/api/address.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const setDefaultCommand = new Command('set-default')
  .description('Set an address as the default')
  .argument('<id>', 'Address ID to set as default')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: OutputOptions) => {
    try {
      const client = getClient();

      const result = await withSpinner('Setting default address...', async () => {
        return setDefaultAddress(client, id);
      });

      if (options.json) {
        output(result, options);
      } else {
        success(`Address ${result.addressId} set as default`);
      }
    } catch (error) {
      handleError(error);
    }
  });
