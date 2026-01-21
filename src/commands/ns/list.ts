import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getNameservers } from '../../lib/api/dns.js';
import { outputJson, type OutputOptions } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List nameservers for a domain')
  .argument('<domain>', 'Domain name')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      const nsInfo = await withSpinner(`Fetching nameservers for ${domain}...`, async () => {
        return getNameservers(client, domain);
      });

      if (options.json) {
        outputJson(nsInfo);
        return;
      }

      console.log();
      console.log(chalk.bold(`Nameservers for ${domain}`));
      console.log();

      if (nsInfo.isUsingOurDns) {
        console.log(chalk.dim('Using Namecheap BasicDNS'));
      } else {
        console.log(chalk.dim('Using custom nameservers'));
      }
      console.log();

      nsInfo.nameservers.forEach((ns, index) => {
        console.log(`  ${index + 1}. ${ns}`);
      });

      console.log();
    } catch (error) {
      handleError(error);
    }
  });
