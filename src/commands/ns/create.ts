import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { createChildNameserver } from '../../lib/api/ns.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, validateIpAddress } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const createCommand = new Command('create')
  .description('Create a child nameserver (glue record)')
  .argument('<domain>', 'Domain name (e.g., example.com)')
  .argument('<nameserver>', 'Nameserver hostname (e.g., ns1.example.com)')
  .argument('<ip>', 'IP address for the nameserver')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, nameserver: string, ip: string, options: OutputOptions) => {
    try {
      validateDomain(domain);
      validateIpAddress(ip);

      // Ensure nameserver is under the domain
      if (!nameserver.endsWith(`.${domain}`)) {
        console.log(chalk.yellow('Warning:'), `Nameserver ${nameserver} should be under ${domain}`);
      }

      const client = getClient();

      await withSpinner(`Creating nameserver ${nameserver}...`, async () => {
        return createChildNameserver(client, domain, nameserver, ip);
      });

      if (options.json) {
        output({ created: true, nameserver, ip, domain }, options);
      } else {
        success(`Child nameserver created: ${nameserver} → ${ip}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
