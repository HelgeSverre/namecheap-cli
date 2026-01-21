# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-21

### Installation

- Published to npm as `namecheap-cli`
- Global installation via npm, yarn, pnpm, or bun
- Run without installing using npx or bunx
- Requires Node.js 18.0.0 or higher

### Added

- **Authentication**
  - `auth login` - Interactive authentication with Namecheap API
  - `auth logout` - Clear stored credentials
  - `auth status` - Check current authentication status

- **Configuration**
  - `config list` - Display all configuration settings
  - `config get <key>` - Get a specific config value
  - `config set <key> <value>` - Set a config value
  - `config path` - Show config file location
  - Support for sandbox mode toggle
  - Configurable default output format (table/json)

- **Domain Management**
  - `domains list` - List all domains with expiry and status
  - `domains info <domain>` - Get detailed domain information
  - `domains check <domain>` - Check domain availability
  - `domains lock <domain>` - Enable registrar lock
  - `domains unlock <domain>` - Disable registrar lock
  - `domains register <domain>` - Register new domains
  - `domains renew <domain>` - Renew existing domains
  - `domains reactivate <domain>` - Reactivate expired domains
  - `domains contacts <domain>` - View and update domain contacts

- **DNS Management**
  - `dns list <domain>` - List all DNS records
  - `dns add <domain>` - Add DNS records (interactive)
  - `dns set <domain>` - Update existing DNS records
  - `dns rm <domain>` - Delete DNS records
  - `dns email list <domain>` - List email forwarding rules
  - `dns email add <domain>` - Add email forwarding
  - `dns email rm <domain> <mailbox>` - Remove email forwarding

- **Nameserver Management**
  - `ns list <domain>` - List current nameservers
  - `ns set <domain> <ns...>` - Set custom nameservers
  - `ns reset <domain>` - Reset to Namecheap defaults
  - `ns create <domain> <ns> <ip>` - Create child nameserver
  - `ns delete <domain> <ns>` - Delete child nameserver
  - `ns info <domain> <ns>` - Get nameserver details
  - `ns update <domain> <ns> <ip>` - Update nameserver IP

- **Account**
  - `users balances` - Display account balances
  - `users pricing <action> [tld]` - Get domain pricing

- **WhoisGuard**
  - `whoisguard list` - List WhoisGuard subscriptions
  - `whoisguard enable <domain>` - Enable domain privacy
  - `whoisguard disable <domain>` - Disable domain privacy
  - `whoisguard allot <id> <domain>` - Assign WhoisGuard to domain
  - `whoisguard unallot <id>` - Remove WhoisGuard from domain
  - `whoisguard renew <id>` - Renew WhoisGuard subscription

- **Output Options**
  - Table output with colored status indicators
  - JSON output with `--json` flag
  - Loading spinners for async operations

- **Error Handling**
  - User-friendly error messages for common API errors
  - Helpful suggestions for fixing issues
  - Validation for domain names and IP addresses

### Infrastructure

- Built with Bun runtime
- Uses Commander.js for CLI framework
- Uses fast-xml-parser for API response parsing
- Supports both production and sandbox Namecheap API endpoints
- Comprehensive test suite with Bun test runner
- Full TypeScript support with strict type checking
- ESLint and Prettier for code quality
- Automated CI/CD with GitHub Actions
