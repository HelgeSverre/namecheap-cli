import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { getClient } from '../../lib/api/client.js';
import {
  checkDomainAvailability,
  type ContactInfo,
  registerDomain,
  type RegisterDomainOptions,
} from '../../lib/api/domains.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const registerCommand = new Command('register')
  .description('Register a new domain')
  .argument('<domain>', 'Domain to register (e.g., example.com)')
  .option('--years <n>', 'Registration period (1-10)', '1')
  .option('--nameservers <ns1,ns2>', 'Custom nameservers (comma-separated)')
  .option('--no-whoisguard', 'Disable WhoisGuard')
  .option('--promo-code <code>', 'Promotional code')
  .option('--contact-file <path>', 'JSON file with contact info')
  .option('--dry-run', 'Check availability and price without registering')
  .option('--json', 'Output as JSON')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(
    async (
      domain: string,
      options: OutputOptions & {
        years: string;
        nameservers?: string;
        whoisguard: boolean;
        promoCode?: string;
        contactFile?: string;
        dryRun?: boolean;
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

        // Check availability first
        const availability = await withSpinner('Checking availability...', async () => {
          return checkDomainAvailability(client, [domain]);
        });

        const domainInfo = availability[0];
        if (!domainInfo?.available) {
          console.log(chalk.red(`Domain ${domain} is not available for registration.`));
          if (domainInfo?.premium) {
            console.log(chalk.dim('This is a premium domain.'));
          }
          process.exit(1);
        }

        console.log(chalk.green(`Domain ${domain} is available!`));

        if (domainInfo.premium && domainInfo.premiumPrice) {
          console.log(chalk.yellow(`Premium domain price: $${domainInfo.premiumPrice}`));
        }

        // Dry run - just show availability
        if (options.dryRun) {
          console.log(chalk.dim('Dry run - domain not registered.'));
          return;
        }

        // Build registration options
        const regOptions: RegisterDomainOptions = {
          years,
          addFreeWhoisguard: options.whoisguard,
          enableWhoisguard: options.whoisguard,
          promoCode: options.promoCode,
        };

        if (options.nameservers) {
          regOptions.nameservers = options.nameservers.split(',').map((ns) => ns.trim());
        }

        // Load contacts from file or prompt
        let contacts: { registrant: ContactInfo } | undefined;

        if (options.contactFile) {
          try {
            const contactData = JSON.parse(readFileSync(options.contactFile, 'utf-8'));
            contacts = { registrant: contactData };
          } catch (_err) {
            throw new ValidationError(`Failed to read contact file: ${options.contactFile}`);
          }
        } else if (!options.yes) {
          // Interactive contact entry
          console.log(chalk.cyan('\nEnter registrant contact information:'));

          const registrant = await promptContactInfo();
          contacts = { registrant };
        } else {
          throw new ValidationError(
            'Contact information required',
            'Use --contact-file <path> or remove -y flag for interactive mode',
          );
        }

        regOptions.contacts = contacts;

        // Confirm registration
        if (!options.yes) {
          console.log();
          console.log(chalk.cyan('Registration summary:'));
          console.log(`  Domain: ${chalk.bold(domain)}`);
          console.log(`  Years: ${years}`);
          console.log(`  WhoisGuard: ${options.whoisguard ? 'Enabled' : 'Disabled'}`);
          if (regOptions.nameservers) {
            console.log(`  Nameservers: ${regOptions.nameservers.join(', ')}`);
          }
          console.log();

          const confirmed = await confirm({
            message: 'Proceed with registration?',
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Registration cancelled.'));
            return;
          }
        }

        // Register the domain
        const result = await withSpinner('Registering domain...', async () => {
          return registerDomain(client, domain, regOptions);
        });

        if (options.json) {
          output(result, options);
        } else {
          success(`Domain ${domain} registered successfully!`);
          console.log();
          console.log(`  Order ID: ${result.orderId}`);
          console.log(`  Domain ID: ${result.domainId}`);
          console.log(`  Charged: $${result.chargedAmount.toFixed(2)}`);
          console.log(`  WhoisGuard: ${result.whoisguardEnabled ? 'Enabled' : 'Disabled'}`);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );

async function promptContactInfo(): Promise<ContactInfo> {
  const firstName = await input({ message: 'First Name:' });
  const lastName = await input({ message: 'Last Name:' });
  const email = await input({ message: 'Email:' });
  const phone = await input({
    message: 'Phone (e.g., +1.5551234567):',
  });
  const address1 = await input({ message: 'Address Line 1:' });
  const address2 = await input({ message: 'Address Line 2 (optional):', default: '' });
  const city = await input({ message: 'City:' });
  const stateProvince = await input({ message: 'State/Province:' });
  const postalCode = await input({ message: 'Postal Code:' });
  const country = await input({ message: 'Country Code (e.g., US, CA, UK):' });
  const organizationName = await input({ message: 'Organization (optional):', default: '' });

  return {
    firstName,
    lastName,
    email,
    phone,
    address1,
    address2: address2 || undefined,
    city,
    stateProvince,
    postalCode,
    country: country.toUpperCase(),
    organizationName: organizationName || undefined,
  };
}
