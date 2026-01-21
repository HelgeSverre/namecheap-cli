import { Command } from 'commander';
import { allotCommand } from './allot.js';
import { disableCommand } from './disable.js';
import { enableCommand } from './enable.js';
import { listCommand } from './list.js';
import { renewCommand } from './renew.js';
import { unallotCommand } from './unallot.js';

export const whoisguardCommand = new Command('whoisguard')
  .description('Manage WhoisGuard domain privacy')
  .addCommand(listCommand)
  .addCommand(enableCommand)
  .addCommand(disableCommand)
  .addCommand(allotCommand)
  .addCommand(unallotCommand)
  .addCommand(renewCommand);
