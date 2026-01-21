import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { addDnsRecord } from '../../lib/api/dns.js';
import type { DnsRecordType } from '../../lib/api/types.js';
import { success } from '../../lib/output.js';
import { handleError, validateDomain, validateRecordType } from '../../utils/errors.js';
import { promptDnsRecord } from '../../utils/prompts.js';
import { isTTY, withSpinner } from '../../utils/spinner.js';

export const addCommand = new Command('add')
  .description('Add a DNS record')
  .argument('<domain>', 'Domain name')
  .option('--type <type>', 'Record type (A, AAAA, CNAME, MX, TXT, etc.)')
  .option('--name <name>', 'Host name (@ for root, or subdomain)')
  .option('--value <value>', 'Record value/address')
  .option('--ttl <seconds>', 'TTL in seconds', '1800')
  .option('--mx-pref <priority>', 'MX priority (for MX records)')
  .action(async (domain: string, options) => {
    try {
      validateDomain(domain);

      let recordInput: {
        name: string;
        type: DnsRecordType;
        address: string;
        ttl: number;
        mxPref?: number;
      };

      // If all required options provided, use them
      if (options.type && options.name && options.value) {
        validateRecordType(options.type);

        recordInput = {
          name: options.name,
          type: options.type.toUpperCase() as DnsRecordType,
          address: options.value,
          ttl: parseInt(options.ttl, 10) || 1800,
          mxPref: options.mxPref ? parseInt(options.mxPref, 10) : undefined,
        };
      } else if (isTTY()) {
        // Interactive mode
        const prompted = await promptDnsRecord();
        recordInput = {
          name: prompted.name,
          type: prompted.type as DnsRecordType,
          address: prompted.address,
          ttl: prompted.ttl,
          mxPref: prompted.mxPref,
        };
      } else {
        throw new Error('Missing required options: --type, --name, --value');
      }

      const client = getClient();

      await withSpinner(`Adding ${recordInput.type} record to ${domain}...`, async () => {
        return addDnsRecord(client, domain, recordInput);
      });

      success(`Added ${recordInput.type} record: ${recordInput.name} -> ${recordInput.address}`);
    } catch (error) {
      handleError(error);
    }
  });
