#!/usr/bin/env node

import { program } from 'commander';
import { addressCommand } from './commands/address/index.js';
import { authCommand } from './commands/auth/index.js';
import { completionsCommand } from './commands/completions/index.js';
import { configCommand } from './commands/config/index.js';
import { dnsCommand } from './commands/dns/index.js';
import { domainsCommand } from './commands/domains/index.js';
import { nsCommand } from './commands/ns/index.js';
import { usersCommand } from './commands/users/index.js';
import { whoisguardCommand } from './commands/whoisguard/index.js';

const packageJson = {
  name: 'namecheap-cli',
  version: '0.1.0',
  description: 'CLI tool for managing Namecheap domains, DNS records, and more',
};

program
  .name('namecheap')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help for command');

// Register commands
program.addCommand(addressCommand);
program.addCommand(authCommand);
program.addCommand(domainsCommand);
program.addCommand(dnsCommand);
program.addCommand(nsCommand);
program.addCommand(configCommand);
program.addCommand(usersCommand);
program.addCommand(whoisguardCommand);
program.addCommand(completionsCommand);

// Add examples to help
program.addHelpText(
  'after',
  `
Examples:
  $ namecheap auth login              # Authenticate with Namecheap API
  $ namecheap domains list            # List all domains
  $ namecheap domains check foo.com   # Check domain availability
  $ namecheap dns list example.com    # List DNS records
  $ namecheap users balances          # Show account balance
  $ namecheap users pricing register com  # Get domain pricing
`,
);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (process.argv.length <= 2) {
  program.help();
}
