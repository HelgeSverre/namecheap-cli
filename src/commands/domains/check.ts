import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { checkDomainAvailability } from '../../lib/api/domains.js';
import { output, type OutputOptions } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const checkCommand = new Command('check')
  .description('Check domain availability')
  .argument('<domains...>', 'Domain name(s) to check')
  .option('--json', 'Output as JSON')
  .action(async (domains: string[], options: OutputOptions) => {
    try {
      // Validate all domains
      domains.forEach(validateDomain);

      const client = getClient();

      const results = await withSpinner(
        `Checking availability for ${domains.length} domain(s)...`,
        async () => {
          return checkDomainAvailability(client, domains);
        },
      );

      output(results, options, {
        headers: ['Domain', 'Available', 'Premium', 'Price'],
        rows: (result: unknown) => {
          const r = result as {
            domain: string;
            available: boolean;
            premium: boolean;
            premiumPrice?: number;
          };
          return [
            r.domain,
            r.available ? chalk.green('Available') : chalk.red('Taken'),
            r.premium ? chalk.yellow('Yes') : chalk.dim('No'),
            r.premiumPrice ? `$${r.premiumPrice}` : chalk.dim('-'),
          ];
        },
      });
    } catch (error) {
      handleError(error);
    }
  });
