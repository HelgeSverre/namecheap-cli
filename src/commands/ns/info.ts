import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getChildNameserverInfo } from '../../lib/api/ns.js';
import { output, type OutputOptions } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const infoCommand = new Command('info')
  .description('Get information about a child nameserver')
  .argument('<domain>', 'Domain name')
  .argument('<nameserver>', 'Nameserver hostname')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, nameserver: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      const nsInfo = await withSpinner(`Fetching nameserver info...`, async () => {
        return getChildNameserverInfo(client, domain, nameserver);
      });

      if (options.json) {
        output(nsInfo, options);
      } else {
        console.log();
        console.log(chalk.bold('Nameserver Information'));
        console.log();
        console.log(`  ${chalk.dim('Hostname:')} ${nsInfo.nameserver}`);
        console.log(`  ${chalk.dim('IP Address:')} ${nsInfo.ip}`);
        if (nsInfo.statuses.length > 0) {
          console.log(`  ${chalk.dim('Statuses:')} ${nsInfo.statuses.join(', ')}`);
        }
        console.log();
      }
    } catch (error) {
      handleError(error);
    }
  });
