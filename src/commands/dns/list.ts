import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getDnsHosts } from '../../lib/api/dns.js';
import { formatTtl, output, type OutputOptions } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List DNS records for a domain')
  .argument('<domain>', 'Domain name')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      const records = await withSpinner(`Fetching DNS records for ${domain}...`, async () => {
        return getDnsHosts(client, domain);
      });

      if (records.length === 0) {
        console.log(`No DNS records found for ${domain}`);
        return;
      }

      output(records, options, {
        headers: ['ID', 'Type', 'Name', 'Value', 'TTL', 'MX Pref'],
        rows: (record: unknown) => {
          const r = record as {
            hostId: string;
            type: string;
            name: string;
            address: string;
            ttl: number;
            mxPref?: number;
          };
          return [
            r.hostId,
            r.type,
            r.name,
            r.address.length > 50 ? r.address.substring(0, 47) + '...' : r.address,
            formatTtl(r.ttl),
            r.mxPref !== undefined ? String(r.mxPref) : '-',
          ];
        },
      });

      console.log(`\nTotal: ${records.length} record(s)`);
    } catch (error) {
      handleError(error);
    }
  });
