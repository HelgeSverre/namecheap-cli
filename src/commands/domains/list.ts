import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { listDomains } from '../../lib/api/domains.js';
import {
  formatExpiry,
  getOutputFormat,
  output,
  type OutputOptions,
  statusBadge,
} from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List all domains in your account')
  .option('--json', 'Output as JSON')
  .option('--page <number>', 'Page number', '1')
  .option('--page-size <number>', 'Results per page', '20')
  .action(async (options: OutputOptions & { page: string; pageSize: string }) => {
    try {
      const client = getClient();

      const result = await withSpinner('Fetching domains...', async () => {
        return listDomains(client, {
          page: parseInt(options.page, 10),
          pageSize: parseInt(options.pageSize, 10),
        });
      });

      const { domains } = result;

      if (domains.length === 0) {
        console.log('No domains found in your account.');
        return;
      }

      output(domains, options, {
        headers: ['Domain', 'Expires', 'Auto-Renew', 'Locked', 'WhoisGuard', 'DNS'],
        rows: (domain: unknown) => {
          const d = domain as {
            name: string;
            expires: string;
            autoRenew: boolean;
            isLocked: boolean;
            whoisGuard: string;
            isOurDns: boolean;
          };
          return [
            d.name,
            formatExpiry(d.expires),
            statusBadge(d.autoRenew),
            statusBadge(d.isLocked, 'Locked', 'Unlocked'),
            statusBadge(d.whoisGuard === 'ENABLED', 'Enabled', 'Disabled'),
            d.isOurDns ? 'Namecheap' : 'Custom',
          ];
        },
      });

      const format = getOutputFormat(options);
      if (format !== 'json') {
        console.log(`\nTotal: ${domains.length} domain(s)`);
      }
    } catch (error) {
      handleError(error);
    }
  });
