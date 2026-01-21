import { Command } from 'commander';
import { balancesCommand } from './balances.js';
import { pricingCommand } from './pricing.js';

export const usersCommand = new Command('users').description(
  'Manage account information and pricing',
);

usersCommand.addCommand(balancesCommand);
usersCommand.addCommand(pricingCommand);
