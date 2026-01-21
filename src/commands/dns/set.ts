import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getDnsHosts, updateDnsRecord } from '../../lib/api/dns.js';
import { success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const setCommand = new Command('set')
  .description('Update an existing DNS record')
  .argument('<domain>', 'Domain name')
  .argument('<record-id>', 'Record ID to update (use "dns list" to find IDs)')
  .option('--name <name>', 'New host name')
  .option('--value <value>', 'New record value/address')
  .option('--ttl <seconds>', 'New TTL in seconds')
  .option('--mx-pref <priority>', 'New MX priority')
  .action(async (domain: string, recordId: string, options) => {
    try {
      validateDomain(domain);

      // Check that at least one update option is provided
      if (!options.name && !options.value && !options.ttl && !options.mxPref) {
        throw new ValidationError(
          'No update options provided',
          'Provide at least one of: --name, --value, --ttl, --mx-pref',
        );
      }

      const client = getClient();

      // Verify record exists
      const existingRecords = await withSpinner(
        `Fetching DNS records for ${domain}...`,
        async () => {
          return getDnsHosts(client, domain);
        },
      );

      const targetRecord = existingRecords.find((r) => r.hostId === recordId);
      if (!targetRecord) {
        throw new ValidationError(
          `Record with ID ${recordId} not found`,
          `Use "namecheap dns list ${domain}" to see available records`,
        );
      }

      const updates: {
        name?: string;
        address?: string;
        ttl?: number;
        mxPref?: number;
      } = {};

      if (options.name) updates.name = options.name;
      if (options.value) updates.address = options.value;
      if (options.ttl) updates.ttl = parseInt(options.ttl, 10);
      if (options.mxPref) updates.mxPref = parseInt(options.mxPref, 10);

      await withSpinner(`Updating record ${recordId}...`, async () => {
        return updateDnsRecord(client, domain, recordId, updates);
      });

      success(`Updated record ${recordId}`);
    } catch (error) {
      handleError(error);
    }
  });
