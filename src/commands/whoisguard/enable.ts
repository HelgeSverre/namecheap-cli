import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { enableWhoisGuard, findWhoisGuardByDomain } from '../../lib/api/whoisguard.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const enableCommand = new Command('enable')
  .description('Enable WhoisGuard for a domain')
  .argument('<domain>', 'Domain name')
  .option('--email <email>', 'Forwarding email address for private contact')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions & { email?: string }) => {
    try {
      validateDomain(domain);

      const client = getClient();

      // Find WhoisGuard for this domain
      const whoisguard = await withSpinner('Finding WhoisGuard...', async () => {
        return findWhoisGuardByDomain(client, domain);
      });

      if (!whoisguard) {
        throw new ValidationError(
          `No WhoisGuard found for domain ${domain}`,
          'Use "namecheap whoisguard list" to see available subscriptions',
        );
      }

      if (whoisguard.enabled) {
        console.log(chalk.yellow('WhoisGuard is already enabled for'), domain);
        return;
      }

      // Get forwarding email
      let email = options.email;
      if (!email) {
        email = await input({
          message: 'Forwarding email address:',
        });
      }

      if (!email?.includes('@')) {
        throw new ValidationError('Valid email address is required');
      }

      await withSpinner('Enabling WhoisGuard...', async () => {
        return enableWhoisGuard(client, whoisguard.id, email);
      });

      if (options.json) {
        output({ enabled: true, domain, whoisguardId: whoisguard.id }, options);
      } else {
        success(`WhoisGuard enabled for ${domain}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
