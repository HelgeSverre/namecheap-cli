import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getDomainInfo, renewDomain } from '../../lib/api/domains.js';
import { formatDate, output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const renewCommand = new Command('renew')
  .description('Renew a domain')
  .argument('<domain>', 'Domain to renew')
  .option('--years <n>', 'Renewal period (1-10)', '1')
  .option('--promo-code <code>', 'Promotional code')
  .option('--json', 'Output as JSON')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    async (
      domain: string,
      options: OutputOptions & {
        years: string;
        promoCode?: string;
        yes?: boolean;
      },
    ) => {
      try {
        validateDomain(domain);

        const years = parseInt(options.years, 10);
        if (isNaN(years) || years < 1 || years > 10) {
          throw new ValidationError('Years must be between 1 and 10');
        }

        const client = getClient();

        // Get current domain info
        const domainInfo = await withSpinner('Fetching domain info...', async () => {
          return getDomainInfo(client, domain);
        });

        console.log(chalk.cyan('Domain:'), domain);
        console.log(chalk.cyan('Current expiry:'), formatDate(domainInfo.expiredDate));
        console.log(chalk.cyan('Renewal period:'), `${years} year${years > 1 ? 's' : ''}`);
        console.log();

        // Confirm renewal
        if (!options.yes) {
          const confirmed = await confirm({
            message: `Renew ${domain} for ${years} year${years > 1 ? 's' : ''}?`,
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Renewal cancelled.'));
            return;
          }
        }

        // Renew the domain
        const result = await withSpinner('Renewing domain...', async () => {
          return renewDomain(client, domain, years, options.promoCode);
        });

        if (options.json) {
          output(result, options);
        } else {
          success(`Domain ${domain} renewed successfully!`);
          console.log();
          console.log(`  Order ID: ${result.orderId}`);
          console.log(`  Charged: $${result.chargedAmount.toFixed(2)}`);
          if (result.expireDate) {
            console.log(`  New expiry: ${formatDate(result.expireDate)}`);
          }
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
