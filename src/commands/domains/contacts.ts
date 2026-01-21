import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { getClient } from '../../lib/api/client.js';
import {
  type ContactInfo,
  type DomainContacts,
  getContacts,
  setContacts,
} from '../../lib/api/domains.js';
import { output, type OutputOptions, success } from '../../lib/output.js';
import { handleError, validateDomain, ValidationError } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const contactsCommand = new Command('contacts')
  .description('Manage domain contacts')
  .argument('<domain>', 'Domain name')
  .argument('[action]', 'Action: get (default) or set', 'get')
  .option('--json', 'Output as JSON')
  .option('--type <type>', 'Contact type: registrant, tech, admin, auxbilling')
  .option('--file <path>', 'JSON file with contact info (for set action)')
  .action(
    async (
      domain: string,
      action: string,
      options: OutputOptions & {
        type?: string;
        file?: string;
      },
    ) => {
      try {
        validateDomain(domain);

        const client = getClient();

        if (action === 'get') {
          // Get contacts
          const contacts = await withSpinner('Fetching contacts...', async () => {
            return getContacts(client, domain);
          });

          if (options.json) {
            if (options.type) {
              const contactType = options.type.toLowerCase() as keyof DomainContacts;
              output(contacts[contactType], options);
            } else {
              output(contacts, options);
            }
          } else {
            if (options.type) {
              const contactType = normalizeContactType(options.type);
              displayContact(
                options.type.charAt(0).toUpperCase() + options.type.slice(1),
                contacts[contactType],
              );
            } else {
              displayContact('Registrant', contacts.registrant);
              console.log();
              displayContact('Tech', contacts.tech);
              console.log();
              displayContact('Admin', contacts.admin);
              console.log();
              displayContact('AuxBilling', contacts.auxBilling);
            }
          }
        } else if (action === 'set') {
          // Set contacts
          let newContacts: Partial<DomainContacts>;

          if (options.file) {
            try {
              const data = JSON.parse(readFileSync(options.file, 'utf-8'));
              newContacts = data;
            } catch (_err) {
              throw new ValidationError(`Failed to read contact file: ${options.file}`);
            }
          } else {
            // Interactive mode
            const contactType = options.type ? normalizeContactType(options.type) : 'registrant';
            console.log(chalk.cyan(`Enter new ${contactType} contact information:`));

            const contact = await promptContactInfo();

            // Ask if should apply to other contact types
            const applyToAll = await confirm({
              message: 'Apply these changes to all contact types?',
              default: false,
            });

            if (applyToAll) {
              newContacts = {
                registrant: contact,
                tech: contact,
                admin: contact,
                auxBilling: contact,
              };
            } else {
              newContacts = { [contactType]: contact };
            }
          }

          // Confirm the update
          const confirmed = await confirm({
            message: `Update contacts for ${domain}?`,
            default: true,
          });

          if (!confirmed) {
            console.log(chalk.dim('Update cancelled.'));
            return;
          }

          await withSpinner('Updating contacts...', async () => {
            return setContacts(client, domain, newContacts);
          });

          success(`Contacts updated for ${domain}`);
        } else {
          throw new ValidationError(`Invalid action: ${action}`, 'Use "get" or "set"');
        }
      } catch (error) {
        handleError(error);
      }
    },
  );

function normalizeContactType(type: string): keyof DomainContacts {
  const normalized = type.toLowerCase();
  if (normalized === 'registrant') return 'registrant';
  if (normalized === 'tech') return 'tech';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'auxbilling' || normalized === 'billing') return 'auxBilling';
  throw new ValidationError(
    `Invalid contact type: ${type}`,
    'Valid types: registrant, tech, admin, auxbilling',
  );
}

function displayContact(title: string, contact: ContactInfo): void {
  console.log(chalk.cyan.bold(`${title} Contact:`));
  console.log(`  Name: ${contact.firstName} ${contact.lastName}`);
  if (contact.organizationName) {
    console.log(`  Organization: ${contact.organizationName}`);
  }
  console.log(`  Email: ${contact.email}`);
  console.log(`  Phone: ${contact.phone}`);
  console.log(`  Address: ${contact.address1}`);
  if (contact.address2) {
    console.log(`           ${contact.address2}`);
  }
  console.log(`           ${contact.city}, ${contact.stateProvince} ${contact.postalCode}`);
  console.log(`           ${contact.country}`);
}

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
