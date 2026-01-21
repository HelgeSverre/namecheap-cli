import { Command } from 'commander';
import { getClient } from '../../lib/api/client.js';
import { getRegistrarLock, setRegistrarLock } from '../../lib/api/domains.js';
import { info, success } from '../../lib/output.js';
import { handleError, validateDomain } from '../../utils/errors.js';
import { withSpinner } from '../../utils/spinner.js';

export const lockCommand = new Command('lock')
  .description('Enable registrar lock on a domain')
  .argument('<domain>', 'Domain name to lock')
  .action(async (domain: string) => {
    try {
      validateDomain(domain);

      const client = getClient();

      // Check current lock status first
      const isLocked = await withSpinner(`Checking lock status for ${domain}...`, async () => {
        return getRegistrarLock(client, domain);
      });

      if (isLocked) {
        info(`${domain} is already locked`);
        return;
      }

      await withSpinner(`Locking ${domain}...`, async () => {
        return setRegistrarLock(client, domain, true);
      });

      success(`Successfully locked ${domain}`);
    } catch (error) {
      handleError(error);
    }
  });

export const unlockCommand = new Command('unlock')
  .description('Disable registrar lock on a domain')
  .argument('<domain>', 'Domain name to unlock')
  .action(async (domain: string) => {
    try {
      validateDomain(domain);

      const client = getClient();

      // Check current lock status first
      const isLocked = await withSpinner(`Checking lock status for ${domain}...`, async () => {
        return getRegistrarLock(client, domain);
      });

      if (!isLocked) {
        info(`${domain} is already unlocked`);
        return;
      }

      await withSpinner(`Unlocking ${domain}...`, async () => {
        return setRegistrarLock(client, domain, false);
      });

      success(`Successfully unlocked ${domain}`);
    } catch (error) {
      handleError(error);
    }
  });
