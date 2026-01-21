import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { allotWhoisGuard } from '../../lib/api/whoisguard.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const allotCommand = new Command('allot')
  .description('Assign a WhoisGuard subscription to a domain')
  .argument('<whoisguard-id>', 'WhoisGuard subscription ID')
  .argument('<domain>', 'Domain to assign WhoisGuard to')
  .option('--json', 'Output as JSON')
  .action(async (whoisguardId: string, domain: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      await withSpinner(`Assigning WhoisGuard ${whoisguardId} to ${domain}...`, async () => {
        return allotWhoisGuard(client, whoisguardId, domain);
      });

      if (options.json) {
        output({ allotted: true, whoisguardId, domain }, options);
      } else {
        success(`WhoisGuard ${whoisguardId} assigned to ${domain}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
