import { Command } from 'commander';
import { listCommand } from './list.js';
import { infoCommand } from './info.js';
import { createCommand } from './create.js';
import { updateCommand } from './update.js';
import { deleteCommand } from './delete.js';
import { setDefaultCommand } from './set-default.js';

export const addressCommand = new Command('address').description('Manage saved addresses');

addressCommand.addCommand(listCommand);
addressCommand.addCommand(infoCommand);
addressCommand.addCommand(createCommand);
addressCommand.addCommand(updateCommand);
addressCommand.addCommand(deleteCommand);
addressCommand.addCommand(setDefaultCommand);
