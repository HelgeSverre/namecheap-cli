import { Command } from 'commander';
import { addCommand } from './add.js';
import { emailCommand } from './email.js';
import { listCommand } from './list.js';
import { rmCommand } from './rm.js';
import { setCommand } from './set.js';

export const dnsCommand = new Command('dns')
  .description('Manage DNS records')
  .addCommand(listCommand)
  .addCommand(addCommand)
  .addCommand(setCommand)
  .addCommand(rmCommand)
  .addCommand(emailCommand);
