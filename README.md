# Namecheap CLI

## A cli for managing Namecheap domains and DNS via the command line.

[![npm version](https://img.shields.io/npm/v/@helgesverre/namecheap-cli?style=flat-square&color=FE5803&label=npm)](https://www.npmjs.com/package/@helgesverre/namecheap-cli)
[![npm downloads](https://img.shields.io/npm/dm/@helgesverre/namecheap-cli?style=flat-square&color=FF8C44&label=downloads)](https://www.npmjs.com/package/@helgesverre/namecheap-cli)
[![CI](https://img.shields.io/github/actions/workflow/status/HelgeSverre/namecheap-cli/ci.yml?style=flat-square&label=CI)](https://github.com/HelgeSverre/namecheap-cli/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-417E38?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-6E6F71?style=flat-square)](https://opensource.org/licenses/MIT)

A powerful command-line interface for managing Namecheap domains, DNS records, nameservers, WhoisGuard privacy
protection, and more. Built with Bun and TypeScript.

## Installation

### Global Install (Recommended)

```bash
# Using npm
npm install -g @helgesverre/namecheap-cli

# Using Yarn
yarn global add @helgesverre/namecheap-cli

# Using pnpm
pnpm add -g @helgesverre/namecheap-cli

# Using Bun
bun install -g @helgesverre/namecheap-cli
```

### Run Without Installing

```bash
# Using npx
npx @helgesverre/namecheap-cli domains list

# Using bunx
bunx @helgesverre/namecheap-cli domains list
```

### Requirements

- Node.js 18.0.0 or higher (or Bun runtime)

## Quick Start

### 1. Get API Credentials

1. Log in to your [Namecheap account](https://www.namecheap.com)
2. Go to Profile > Tools > API Access
3. Enable API access (requires account balance > $50 or domains > 20)
4. Whitelist your IP address
5. Copy your API key

### 2. Authenticate

```bash
namecheap auth login
```

You'll be prompted for:

- **Username**: Your Namecheap username
- **API Key**: From the API Access page
- **Client IP**: Your whitelisted IP address

### 3. Start Using

```bash
# List your domains
namecheap domains list

# Check domain availability
namecheap domains check example.com

# View DNS records
namecheap dns list example.com
```

## Commands

### Authentication

```bash
namecheap auth login     # Authenticate with API
namecheap auth logout    # Clear credentials
namecheap auth status    # Check auth status
```

### Domains

```bash
namecheap domains list              # List all domains
namecheap domains info <domain>     # Get domain details
namecheap domains check <domain>    # Check availability
namecheap domains lock <domain>     # Enable registrar lock
namecheap domains unlock <domain>   # Disable registrar lock
namecheap domains register <domain> # Register new domain
namecheap domains renew <domain>    # Renew domain
namecheap domains contacts <domain> # Manage contacts
```

### DNS Records

```bash
namecheap dns list <domain>    # List DNS records
namecheap dns add <domain>     # Add record (interactive)
namecheap dns set <domain>     # Update record
namecheap dns rm <domain>      # Delete record

# Email forwarding
namecheap dns email list <domain>        # List forwards
namecheap dns email add <domain>         # Add forward
namecheap dns email rm <domain> <mailbox># Remove forward
```

### Nameservers

```bash
namecheap ns list <domain>           # List nameservers
namecheap ns set <domain> <ns1> <ns2># Set custom nameservers
namecheap ns reset <domain>          # Reset to Namecheap defaults

# Child nameservers (glue records)
namecheap ns create <domain> <ns> <ip>  # Create
namecheap ns delete <domain> <ns>       # Delete
namecheap ns info <domain> <ns>         # Get info
namecheap ns update <domain> <ns> <ip>  # Update IP
```

### Account

```bash
namecheap users balances                 # Show account balance
namecheap users pricing register com     # Get pricing
```

### WhoisGuard (Privacy)

```bash
namecheap whoisguard list                     # List subscriptions
namecheap whoisguard enable <domain>          # Enable privacy
namecheap whoisguard disable <domain>         # Disable privacy
namecheap whoisguard allot <id> <domain>      # Assign to domain
namecheap whoisguard unallot <id>             # Remove from domain
namecheap whoisguard renew <id>               # Renew subscription
```

### Configuration

```bash
namecheap config list              # Show config
namecheap config get <key>         # Get value
namecheap config set <key> <value> # Set value
namecheap config path              # Show config file path
```

**Config Options:**

- `sandbox` - Use sandbox API (true/false)
- `output` - Default output format (table/json)

## Sandbox Mode

For testing without affecting production:

```bash
# Enable sandbox mode
namecheap config set sandbox true

# Authenticate with sandbox credentials
namecheap auth login

# Test commands (uses sandbox API)
namecheap domains list
```

Get sandbox credentials at: https://www.sandbox.namecheap.com

### Shell Completions

Enable tab completion for your shell:

```bash
# Automatic install (auto-detects your shell)
namecheap completions install

# Or install for a specific shell
namecheap completions install --shell bash
namecheap completions install --shell zsh
namecheap completions install --shell fish

# macOS with Homebrew: install to Homebrew's completion directories
namecheap completions install --homebrew

# Manual setup (alternative)
# Bash - Add to ~/.bashrc
eval "$(namecheap completions bash)"

# Zsh - Add to ~/.zshrc
eval "$(namecheap completions zsh)"

# Fish - Add to ~/.config/fish/config.fish
namecheap completions fish | source
```

To uninstall completions:

```bash
namecheap completions uninstall
```

## Output Formats

All commands support JSON output:

```bash
# Table output (default)
namecheap domains list

# JSON output
namecheap domains list --json

# Set default format
namecheap config set output json
```

## Troubleshooting

### Common Errors

| Error                 | Solution                                           |
|-----------------------|----------------------------------------------------|
| "Not authenticated"   | Run `namecheap auth login`                         |
| "IP not whitelisted"  | Add your IP at Namecheap > Profile > API Access    |
| "API access disabled" | Enable at Namecheap > Profile > Tools > API Access |
| "Invalid API Key"     | Re-run `namecheap auth login` with correct key     |
| "Domain not found"    | Check domain name and ownership                    |

### Check Status

```bash
# Verify authentication
namecheap auth status

# Check current config
namecheap config list
```

## API Requirements

Before using this CLI, ensure:

1. **API Access Enabled** - Go to your Namecheap account → Profile → Tools → API Access
2. **IP Whitelisted** - Add your current IP address to the whitelist
3. **Account Balance** - Maintain balance > $50 OR own 20+ domains
4. **API Key** - Copy your API key from the API Access page

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/HelgeSverre/namecheap-cli.git
cd namecheap-cli

# Install dependencies
bun install

# Run in development
bun run dev

# Build for production
bun run build
```

### Project Structure

```
namecheap-cli/
├── src/
│   ├── commands/       # Command implementations
│   │   ├── auth/       # Authentication commands
│   │   ├── config/     # Configuration commands
│   │   ├── dns/        # DNS management
│   │   ├── domains/    # Domain management
│   │   ├── ns/         # Nameserver management
│   │   ├── users/      # Account info
│   │   └── whoisguard/ # Privacy protection
│   ├── lib/            # Core libraries
│   │   ├── api/        # API client and parsers
│   │   ├── config.ts   # Configuration management
│   │   └── output.ts   # Output formatting
│   └── utils/          # Utility functions
├── tests/              # Test suite
└── docs/               # Documentation
```

## Testing

This project uses [Bun's built-in test runner](https://bun.sh/docs/cli/test) for testing.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test tests/lib/api/client.test.ts

# Run tests matching a pattern
bun test --filter "domains"
```

### Test Structure

```
tests/
├── commands/           # Command handler tests
│   ├── auth.test.ts
│   ├── config.test.ts
│   ├── dns.test.ts
│   ├── domains.test.ts
│   ├── ns.test.ts
│   ├── users.test.ts
│   └── whoisguard.test.ts
├── lib/               # Library/utility tests
│   ├── api/
│   │   ├── client.test.ts
│   │   ├── dns.test.ts
│   │   ├── domains.test.ts
│   │   └── parser.test.ts
│   ├── config.test.ts
│   └── output.test.ts
├── utils/
│   └── errors.test.ts
├── fixtures/          # XML test fixtures
│   └── *.xml
└── helpers/           # Test utilities
    └── command-test-utils.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Code Quality

This project uses strict TypeScript, ESLint, and Prettier for code quality.

```bash
# Run all checks
bun run check

# Auto-fix issues
bun run fix

# Individual commands
bun run typecheck     # TypeScript type check
bun run lint          # ESLint
bun run lint:fix      # ESLint with auto-fix
bun run format        # Prettier format
bun run format:check  # Prettier check
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run checks: `bun run check && bun test`
6. Commit your changes with descriptive messages
7. Push to your fork and submit a pull request

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and changes.

## Support

- 📖 [Documentation](https://github.com/HelgeSverre/namecheap-cli)
- 🐛 [Issue Tracker](https://github.com/HelgeSverre/namecheap-cli/issues)
- 💬 [Discussions](https://github.com/HelgeSverre/namecheap-cli/discussions)

## Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js)
- Powered by [Bun](https://bun.sh) runtime
- Uses [Namecheap API](https://www.namecheap.com/support/api/)

## License

MIT
