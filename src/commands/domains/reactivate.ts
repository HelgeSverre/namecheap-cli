import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { reactivateDomain } from '../../lib/api/domains.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const reactivateCommand = new Command('reactivate')
  .description('Reactivate an expired domain')
  .argument('<domain>', 'Domain to reactivate')
  .option('--years <n>', 'Renewal period after reactivation (1-10)', '1')
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

        console.log(chalk.yellow('Warning:'), 'Domain reactivation may have additional fees.');
        console.log(chalk.cyan('Domain:'), domain);
        console.log(chalk.cyan('Renewal period:'), `${years} year${years > 1 ? 's' : ''}`);
        console.log();

        // Confirm reactivation
        if (!options.yes) {
          const confirmed = await confirm({
            message: `Reactivate ${domain}? This will charge your account.`,
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Reactivation cancelled.'));
            return;
          }
        }

        // Reactivate the domain
        const result = await withSpinner('Reactivating domain...', async () => {
          return reactivateDomain(client, domain, years, options.promoCode);
        });

        if (options.json) {
          output(result, options);
        } else {
          if (result.charged) {
            success(`Domain ${domain} reactivated successfully!`);
          } else {
            console.log(chalk.yellow(`Domain ${domain} reactivation initiated.`));
          }
          console.log();
          console.log(`  Order ID: ${result.orderId}`);
          console.log(`  Charged: $${result.chargedAmount.toFixed(2)}`);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
