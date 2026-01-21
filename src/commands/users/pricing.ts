import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getPricing, type PricingOptions } from '../../lib/api/users.js';
import { output, type OutputOptions, outputTable } from '../../lib/output.js';
import { handleError, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

const VALID_ACTIONS = ['register', 'renew', 'transfer', 'restore'] as const;
type PricingAction = (typeof VALID_ACTIONS)[number];

export const pricingCommand = new Command('pricing')
  .description('Get domain pricing for registration, renewal, transfer, or restore')
  .argument('<action>', `Action type: ${VALID_ACTIONS.join(', ')}`)
  .argument('[tld]', 'TLD to check (e.g., com, net, org)')
  .option('--json', 'Output as JSON')
  .option('--years <n>', 'Number of years (1-10)', '1')
  .action(
    async (action: string, tld: string | undefined, options: OutputOptions & { years: string }) => {
      try {
        // Validate action
        const normalizedAction = action.toLowerCase() as PricingAction;
        if (!VALID_ACTIONS.includes(normalizedAction)) {
          throw new ValidationError(
            `Invalid action: ${action}`,
            `Valid actions: ${VALID_ACTIONS.join(', ')}`,
          );
        }

        // Validate years
        const years = parseInt(options.years, 10);
        if (isNaN(years) || years < 1 || years > 10) {
          throw new ValidationError(
            'Years must be between 1 and 10',
            'Use --years <n> with a value between 1 and 10',
          );
        }

        const client = getClient();

        const pricingOptions: PricingOptions = {
          action: normalizedAction,
          tld: tld,
          years,
        };

        const pricing = await withSpinner('Fetching pricing...', async () => {
          return getPricing(client, pricingOptions);
        });

        if (pricing.length === 0) {
          console.log(chalk.yellow('No pricing information found for the specified criteria.'));
          if (tld) {
            console.log(chalk.dim(`Try a different TLD or check if "${tld}" is available.`));
          }
          return;
        }

        if (options.json) {
          output(pricing, options);
        } else {
          outputTable(
            ['TLD', 'Action', 'Duration', 'Your Price', 'Regular Price'],
            pricing.map((p) => [
              chalk.cyan(p.productName),
              capitalizeAction(normalizedAction),
              `${p.duration} year${p.duration > 1 ? 's' : ''}`,
              formatPrice(p.yourPrice, p.currency),
              p.regularPrice !== p.yourPrice
                ? chalk.strikethrough(chalk.dim(formatPrice(p.regularPrice, p.currency)))
                : chalk.dim('-'),
            ]),
          );

          console.log();
          console.log(
            chalk.dim(`Prices shown for ${years} year${years > 1 ? 's' : ''} ${normalizedAction}.`),
          );

          if (pricing.length > 10) {
            console.log(
              chalk.dim(`Showing ${pricing.length} results. Use a specific TLD to narrow down.`),
            );
          }
        }
      } catch (error) {
        handleError(error);
      }
    },
  );

function formatPrice(amount: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

function capitalizeAction(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
