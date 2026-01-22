import { Command } from 'commander';
import { addFundsCommand } from './add-funds.js';
import { balancesCommand } from './balances.js';
import { changePasswordCommand } from './change-password.js';
import { createCommand } from './create.js';
import { fundsStatusCommand } from './funds-status.js';
import { loginCommand } from './login.js';
import { pricingCommand } from './pricing.js';
import { resetPasswordCommand } from './reset-password.js';
import { updateCommand } from './update.js';

export const usersCommand = new Command('users').description(
  'Manage account information and pricing',
);

usersCommand.addCommand(addFundsCommand);
usersCommand.addCommand(balancesCommand);
usersCommand.addCommand(changePasswordCommand);
usersCommand.addCommand(createCommand);
usersCommand.addCommand(fundsStatusCommand);
usersCommand.addCommand(loginCommand);
usersCommand.addCommand(pricingCommand);
usersCommand.addCommand(resetPasswordCommand);
usersCommand.addCommand(updateCommand);
