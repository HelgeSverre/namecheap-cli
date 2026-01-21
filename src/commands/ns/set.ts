import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { setCustomNameservers } from '../../lib/api/dns.js';
import { success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const setCommand = new Command('set')
  .description('Set custom nameservers for a domain')
  .argument('<domain>', 'Domain name')
  .argument('<nameservers...>', 'Nameserver hostnames (2-4 required)')
  .action(async (domain: string, nameservers: string[]) => {
    try {
      validateDomain(domain);

      if (nameservers.length < 2) {
        throw new ValidationError(
          'At least 2 nameservers are required',
          'Example: namecheap ns set example.com ns1.provider.com ns2.provider.com',
        );
      }

      if (nameservers.length > 5) {
        throw new ValidationError('Maximum 5 nameservers allowed');
      }

      const client = getClient();

      await withSpinner(`Setting nameservers for ${domain}...`, async () => {
        return setCustomNameservers(client, domain, nameservers);
      });

      success(`Set ${nameservers.length} nameservers for ${domain}`);
      nameservers.forEach((ns, i) => {
        console.log(`  ${i + 1}. ${ns}`);
      });
    } catch (error) {
      handleError(error);
    }
  });
