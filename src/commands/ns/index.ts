import { Command } from 'commander';
import { createCommand } from './create.js';
import { deleteCommand } from './delete.js';
import { infoCommand } from './info.js';
import { listCommand } from './list.js';
import { resetCommand } from './reset.js';
import { setCommand } from './set.js';
import { updateCommand } from './update.js';

export const nsCommand = new Command('ns')
  .description('Manage nameservers')
  .addCommand(listCommand)
  .addCommand(setCommand)
  .addCommand(resetCommand)
  .addCommand(createCommand)
  .addCommand(deleteCommand)
  .addCommand(infoCommand)
  .addCommand(updateCommand);
