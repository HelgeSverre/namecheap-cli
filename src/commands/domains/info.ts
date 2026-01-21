import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getDomainInfo } from '../../lib/api/domains.js';
import { formatDate, outputJson, statusBadge } from '../../lib/output.js';
import type { OutputOptions } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const infoCommand = new Command('info')
  .description('Get detailed information about a domain')
  .argument('<domain>', 'Domain name to get info for')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      const info = await withSpinner(`Fetching info for ${domain}...`, async () => {
        return getDomainInfo(client, domain);
      });

      if (options.json) {
        outputJson(info);
        return;
      }

      console.log();
      console.log(chalk.bold(info.domainName));
      console.log();
      console.log(`  ${chalk.dim('Status:')}       ${statusBadge(info.status)}`);
      console.log(`  ${chalk.dim('Owner:')}        ${info.ownerName}`);
      console.log(`  ${chalk.dim('Created:')}      ${formatDate(info.createdDate)}`);
      console.log(`  ${chalk.dim('Expires:')}      ${formatDate(info.expiredDate)}`);
      console.log(`  ${chalk.dim('Premium:')}      ${statusBadge(info.isPremium)}`);
      console.log();
      console.log(chalk.dim('DNS'));
      console.log(`  ${chalk.dim('Provider:')}     ${info.dnsProviderType}`);
      console.log();
      console.log(chalk.dim('WhoisGuard'));
      console.log(
        `  ${chalk.dim('Status:')}       ${statusBadge(info.whoisGuard.enabled, 'Enabled', 'Disabled')}`,
      );
      if (info.whoisGuard.enabled) {
        console.log(`  ${chalk.dim('Expires:')}      ${formatDate(info.whoisGuard.expiredDate)}`);
      }
      console.log();
    } catch (error) {
      handleError(error);
    }
  });
