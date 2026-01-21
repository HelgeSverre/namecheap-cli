import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { disableWhoisGuard, findWhoisGuardByDomain } from '../../lib/api/whoisguard.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const disableCommand = new Command('disable')
  .description('Disable WhoisGuard for a domain')
  .argument('<domain>', 'Domain name')
  .option('-y, --yes', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions & { yes?: boolean }) => {
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

      if (!whoisguard.enabled) {
        console.log(chalk.yellow('WhoisGuard is already disabled for'), domain);
        return;
      }

      // Confirm disabling
      if (!options.yes) {
        console.log(
          chalk.yellow('Warning:'),
          'Disabling WhoisGuard will expose your WHOIS information.',
        );
        const confirmed = await confirm({
          message: `Disable WhoisGuard for ${domain}?`,
          default: false,
        });

        if (!confirmed) {
          console.log(chalk.dim('Cancelled.'));
          return;
        }
      }

      await withSpinner('Disabling WhoisGuard...', async () => {
        return disableWhoisGuard(client, whoisguard.id);
      });

      if (options.json) {
        output({ disabled: true, domain, whoisguardId: whoisguard.id }, options);
      } else {
        success(`WhoisGuard disabled for ${domain}`);
      }
    } catch (error) {
      handleError(error);
    }
  });
