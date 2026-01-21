import { Command } from 'commander';
import { clearClient } from '../../lib/api/client.js';
import { clearCredentials, isAuthenticated } from '../../lib/config.js';
import { success, warning } from '../../lib/output.js';
import { handleError } from '../../utils/errors.js';

export const logoutCommand = new Command('logout')
  .description('Clear stored authentication credentials')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        warning('Not currently authenticated');
        return;
      }

      clearCredentials();
      clearClient();
      success('Successfully logged out');
    } catch (error) {
      handleError(error);
    }
  });
