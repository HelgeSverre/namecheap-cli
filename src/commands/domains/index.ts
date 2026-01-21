import { Command } from 'commander';
import { checkCommand } from './check.js';
import { contactsCommand } from './contacts.js';
import { infoCommand } from './info.js';
import { listCommand } from './list.js';
import { lockCommand, unlockCommand } from './lock.js';
import { reactivateCommand } from './reactivate.js';
import { registerCommand } from './register.js';
import { renewCommand } from './renew.js';

export const domainsCommand = new Command('domains')
  .description('Manage domains')
  .addCommand(listCommand)
  .addCommand(infoCommand)
  .addCommand(checkCommand)
  .addCommand(lockCommand)
  .addCommand(unlockCommand)
  .addCommand(registerCommand)
  .addCommand(renewCommand)
  .addCommand(reactivateCommand)
  .addCommand(contactsCommand);
