import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { addEmailForward, getEmailForwarding, removeEmailForward } from '../../lib/api/dns.js';
import { output, type OutputOptions, outputTable, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

// Parent command for email subcommands
export const emailCommand = new Command('email').description('Manage email forwarding');

// List email forwards
const listCommand = new Command('list')
  .description('List email forwarding rules')
  .argument('<domain>', 'Domain name')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, options: OutputOptions) => {
    try {
      validateDomain(domain);

      const client = getClient();

      const forwards = await withSpinner('Fetching email forwards...', async () => {
        return getEmailForwarding(client, domain);
      });

      if (forwards.length === 0) {
        console.log(chalk.dim('No email forwarding rules configured.'));
        return;
      }

      if (options.json) {
        output(forwards, options);
      } else {
        outputTable(
          ['Mailbox', 'Forward To'],
          forwards.map((f) => [chalk.cyan(`${f.mailbox}@${domain}`), f.forwardTo]),
        );
        console.log();
        console.log(chalk.dim(`${forwards.length} forwarding rule(s) configured.`));
      }
    } catch (error) {
      handleError(error);
    }
  });

// Add email forward
const addCommand = new Command('add')
  .description('Add email forwarding rule')
  .argument('<domain>', 'Domain name')
  .option('--mailbox <name>', 'Email prefix (e.g., "info")')
  .option('--forward-to <email>', 'Destination email address')
  .option('--json', 'Output as JSON')
  .action(
    async (
      domain: string,
      options: OutputOptions & {
        mailbox?: string;
        forwardTo?: string;
      },
    ) => {
      try {
        validateDomain(domain);

        const client = getClient();

        let mailbox = options.mailbox;
        let forwardTo = options.forwardTo;

        // Interactive mode if options not provided
        if (!mailbox) {
          mailbox = await input({
            message: `Mailbox name (e.g., "info" for info@${domain}):`,
          });
        }

        if (!forwardTo) {
          forwardTo = await input({
            message: 'Forward to email address:',
          });
        }

        // Validate inputs
        if (!mailbox) {
          throw new ValidationError('Mailbox name is required');
        }

        if (!forwardTo?.includes('@')) {
          throw new ValidationError('Valid destination email address is required');
        }

        // Strip @ and domain if user provided full email
        mailbox = mailbox.split('@')[0] ?? mailbox;

        await withSpinner('Adding email forward...', async () => {
          return addEmailForward(client, domain, mailbox, forwardTo);
        });

        if (options.json) {
          output({ mailbox, forwardTo, domain }, options);
        } else {
          success(`Email forward created: ${mailbox}@${domain} → ${forwardTo}`);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );

// Remove email forward
const rmCommand = new Command('rm')
  .description('Remove email forwarding rule')
  .argument('<domain>', 'Domain name')
  .argument('<mailbox>', 'Mailbox name to remove')
  .option('--force', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .action(async (domain: string, mailbox: string, options: OutputOptions & { force?: boolean }) => {
    try {
      validateDomain(domain);

      const client = getClient();

      // Strip @ and domain if user provided full email
      mailbox = mailbox.split('@')[0] ?? mailbox;

      // Confirm deletion
      if (!options.force) {
        const confirmed = await confirm({
          message: `Remove email forward for ${mailbox}@${domain}?`,
          default: false,
        });

        if (!confirmed) {
          console.log(chalk.dim('Removal cancelled.'));
          return;
        }
      }

      await withSpinner('Removing email forward...', async () => {
        return removeEmailForward(client, domain, mailbox);
      });

      if (options.json) {
        output({ removed: true, mailbox, domain }, options);
      } else {
        success(`Email forward removed: ${mailbox}@${domain}`);
      }
    } catch (error) {
      handleError(error);
    }
  });

emailCommand.addCommand(listCommand);
emailCommand.addCommand(addCommand);
emailCommand.addCommand(rmCommand);
