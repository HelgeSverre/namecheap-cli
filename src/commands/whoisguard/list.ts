import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getWhoisGuardList } from '../../lib/api/whoisguard.js';
import {
  formatDate,
  output,
  type OutputOptions,
  outputTable,
  statusBadge,
} from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List WhoisGuard subscriptions')
  .option('--json', 'Output as JSON')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '20')
  .action(async (options: OutputOptions & { page: string; pageSize: string }) => {
    try {
      const client = getClient();

      const result = await withSpinner('Fetching WhoisGuard subscriptions...', async () => {
        return getWhoisGuardList(client, {
          page: parseInt(options.page, 10),
          pageSize: parseInt(options.pageSize, 10),
        });
      });

      if (result.items.length === 0) {
        console.log(chalk.dim('No WhoisGuard subscriptions found.'));
        return;
      }

      if (options.json) {
        output(result.items, options);
      } else {
        outputTable(
          ['ID', 'Domain', 'Status', 'Enabled', 'Expires'],
          result.items.map((item) => [
            chalk.dim(item.id),
            item.domainName || chalk.dim('(unassigned)'),
            statusBadge(item.status),
            statusBadge(item.enabled, 'Yes', 'No'),
            formatDate(item.expireDate),
          ]),
        );

        console.log();
        console.log(chalk.dim(`Total: ${result.totalItems} subscription(s)`));
      }
    } catch (error) {
      handleError(error);
    }
  });
