import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { deleteDnsRecord, getDnsHosts } from '../../lib/api/dns.js';
import { success, warning } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { confirmDangerousOperation } from '../../utils/prompts.js';
import { withSpinner } from '../../utils/spinner.js';

export const rmCommand = new Command('rm')
  .description('Remove a DNS record')
  .argument('<domain>', 'Domain name')
  .argument('<record-id>', 'Record ID to remove (use "dns list" to find IDs)')
  .option('--force', 'Skip confirmation prompt')
  .action(async (domain: string, recordId: string, options) => {
    try {
      validateDomain(domain);

      const client = getClient();

      // Fetch existing records to show what we're deleting
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

      console.log(`\nRecord to delete:`);
      console.log(`  Type: ${targetRecord.type}`);
      console.log(`  Name: ${targetRecord.name}`);
      console.log(`  Value: ${targetRecord.address}`);
      console.log();

      // Confirm unless --force is used
      if (!options.force) {
        const confirmed = await confirmDangerousOperation(
          'delete',
          `${targetRecord.type} record for ${targetRecord.name}`,
        );
        if (!confirmed) {
          warning('Operation cancelled');
          return;
        }
      }

      await withSpinner(`Deleting record ${recordId}...`, async () => {
        return deleteDnsRecord(client, domain, recordId);
      });

      success(`Deleted record ${recordId}`);
    } catch (error) {
      handleError(error);
    }
  });
