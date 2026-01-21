import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getChildNameserverInfo, updateChildNameserver } from '../../lib/api/ns.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, validateIpAddress } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const updateCommand = new Command('update')
  .description('Update the IP address of a child nameserver')
  .argument('<domain>', 'Domain name')
  .argument('<nameserver>', 'Nameserver hostname')
  .argument('<ip>', 'New IP address')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, nameserver: string, newIp: string, options: OutputOptions) => {
    try {
      validateDomain(domain);
      validateIpAddress(newIp);

      const client = getClient();

      // Get current IP first (required by API)
      const currentInfo = await withSpinner(`Fetching current nameserver info...`, async () => {
        return getChildNameserverInfo(client, domain, nameserver);
      });

      const oldIp = currentInfo.ip;

      if (oldIp === newIp) {
        console.log(chalk.yellow('IP address is already set to'), newIp);
        return;
      }

      console.log(chalk.dim(`Current IP: ${oldIp}`));
      console.log(chalk.dim(`New IP: ${newIp}`));

      await withSpinner(`Updating nameserver ${nameserver}...`, async () => {
        return updateChildNameserver(client, domain, nameserver, oldIp, newIp);
      });

      if (options.json) {
        output({ updated: true, nameserver, oldIp, newIp, domain }, options);
      } else {
        success(`Nameserver updated: ${nameserver} → ${newIp}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
