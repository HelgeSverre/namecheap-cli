import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { renewWhoisGuard } from '../../lib/api/whoisguard.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const renewCommand = new Command('renew')
  .description('Renew a WhoisGuard subscription')
  .argument('<whoisguard-id>', 'WhoisGuard subscription ID')
  .option('--years <n>', 'Renewal period (1-10)', '1')
  .option('--promo-code <code>', 'Promotional code')
  .option('-y, --yes', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .action(
    async (
      whoisguardId: string,
      options: OutputOptions & {
        years: string;
        promoCode?: string;
        yes?: boolean;
      },
    ) => {
      try {
        const years = parseInt(options.years, 10);
        if (isNaN(years) || years < 1 || years > 10) {
          throw new ValidationError('Years must be between 1 and 10');
        }

        const client = getClient();

        console.log(chalk.cyan('WhoisGuard ID:'), whoisguardId);
        console.log(chalk.cyan('Renewal period:'), `${years} year${years > 1 ? 's' : ''}`);
        console.log();

        // Confirm renewal
        if (!options.yes) {
          const confirmed = await confirm({
            message: `Renew WhoisGuard ${whoisguardId} for ${years} year${years > 1 ? 's' : ''}?`,
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Renewal cancelled.'));
            return;
          }
        }

        const result = await withSpinner('Renewing WhoisGuard...', async () => {
          return renewWhoisGuard(client, whoisguardId, years, options.promoCode);
        });

        if (options.json) {
          output(result, options);
        } else {
          success(`WhoisGuard ${whoisguardId} renewed successfully!`);
          console.log();
          console.log(`  Order ID: ${result.orderId}`);
          console.log(`  Charged: $${result.chargedAmount.toFixed(2)}`);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
