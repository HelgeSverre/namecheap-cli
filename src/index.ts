#!/usr/bin/env node

import { createProgram } from './cli.js';
import { completionsCommand } from './commands/completions/index.js';
import { checkForUpdates } from './utils/update-check.js';

const program = createProgram();
program.addCommand(completionsCommand);

checkForUpdates();

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
