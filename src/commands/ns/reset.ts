import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { setDefaultNameservers } from '../../lib/api/dns.js';
import { success, warning } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { confirmDangerousOperation } from '../../utils/prompts.js';
import { withSpinner } from '../../utils/spinner.js';

export const resetCommand = new Command('reset')
  .description('Reset nameservers to Namecheap defaults')
  .argument('<domain>', 'Domain name')
  .option('--force', 'Skip confirmation prompt')
  .action(async (domain: string, options) => {
    try {
      validateDomain(domain);

      // Confirm unless --force is used
      if (!options.force) {
        const confirmed = await confirmDangerousOperation(
          'reset nameservers to Namecheap defaults for',
          domain,
        );
        if (!confirmed) {
          warning('Operation cancelled');
          return;
        }
      }

      const client = getClient();

      await withSpinner(`Resetting nameservers for ${domain}...`, async () => {
        return setDefaultNameservers(client, domain);
      });

      success(`Reset nameservers for ${domain} to Namecheap defaults`);
    } catch (error) {
      handleError(error);
    }
  });
