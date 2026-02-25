# Getting Started

## Prerequisites

- **Node.js** 18.0.0 or higher, or the [Bun](https://bun.sh) runtime

## Installation

### Global Install (Recommended)

```bash
# Using npm
npm install -g ncli

# Using pnpm
pnpm add -g ncli

# Using Yarn
yarn global add ncli

# Using Bun
bun install -g ncli
```

### Run Without Installing

You can try out the CLI without installing it globally:

```bash
# Using npx
npx ncli domains list

# Using bunx
bunx ncli domains list
```

## API Credentials Setup

Before using the CLI, you need API credentials from Namecheap:

1. Log in to your [Namecheap account](https://www.namecheap.com)
2. Go to **Profile > Tools > API Access**
3. Enable API access (requires account balance > $50 or 20+ domains)
4. Whitelist your IP address
5. Copy your API key

::: tip
You can find your current public IP address by visiting [whatismyip.com](https://www.whatismyip.com) or running `curl ifconfig.me` in your terminal.
:::

## Authentication

Once you have your API credentials, authenticate the CLI:

```bash
namecheap auth login
```

You will be prompted for:

- **Username** -- Your Namecheap username
- **API Key** -- From the API Access page
- **Client IP** -- Your whitelisted IP address

## First Commands

After authenticating, try these commands to verify everything is working:

```bash
# List your domains
namecheap domains list

# Check domain availability
namecheap domains check example.com

# View DNS records for a domain
namecheap dns list example.com
```

## Troubleshooting

### Common Errors

| Error | Solution |
|---|---|
| "Not authenticated" | Run `namecheap auth login` |
| "IP not whitelisted" | Add your IP at Namecheap > Profile > API Access |
| "API access disabled" | Enable at Namecheap > Profile > Tools > API Access |
| "Invalid API Key" | Re-run `namecheap auth login` with the correct key |
| "Domain not found" | Check the domain name and verify ownership |

### Check Status

You can verify your authentication and configuration at any time:

```bash
# Verify authentication
namecheap auth status

# Check current config
namecheap config list
```
