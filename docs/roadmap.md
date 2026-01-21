# Namecheap CLI Roadmap

## Overview

This document tracks the implementation status and future plans for the Namecheap CLI.

## Feature Status

| Phase | Feature               | Status  | Notes                                        |
| ----- | --------------------- | ------- | -------------------------------------------- |
| 0     | Global Error Handling | Done    | User-friendly API error messages             |
| 1     | Users                 | Done    | balances, pricing                            |
| 2     | Domain Management     | Done    | register, renew, reactivate, contacts        |
| 3     | DNS Email Forwarding  | Done    | list, add, rm                                |
| 4     | Child Nameservers     | Done    | create, delete, info, update                 |
| 5     | WhoisGuard            | Done    | list, enable, disable, allot, unallot, renew |
| 6     | Transfers             | Planned | Future release                               |
| 7     | SSL Certificates      | Planned | Future release                               |

## Command Reference

### Authentication (`namecheap auth`)

| Command       | Description                     | Status |
| ------------- | ------------------------------- | ------ |
| `auth login`  | Authenticate with Namecheap API | Done   |
| `auth logout` | Clear stored credentials        | Done   |
| `auth status` | Check authentication status     | Done   |

### Configuration (`namecheap config`)

| Command                    | Description            | Status |
| -------------------------- | ---------------------- | ------ |
| `config list`              | Show all configuration | Done   |
| `config get <key>`         | Get a config value     | Done   |
| `config set <key> <value>` | Set a config value     | Done   |
| `config path`              | Show config file path  | Done   |

### Users (`namecheap users`)

| Command                        | Description                             | Status |
| ------------------------------ | --------------------------------------- | ------ |
| `users balances`               | Show account balances                   | Done   |
| `users pricing <action> [tld]` | Get pricing for register/renew/transfer | Done   |

### Domains (`namecheap domains`)

| Command                       | Description                  | Status |
| ----------------------------- | ---------------------------- | ------ |
| `domains list`                | List all domains             | Done   |
| `domains info <domain>`       | Get domain details           | Done   |
| `domains check <domain>`      | Check domain availability    | Done   |
| `domains lock <domain>`       | Enable registrar lock        | Done   |
| `domains unlock <domain>`     | Disable registrar lock       | Done   |
| `domains register <domain>`   | Register a new domain        | Done   |
| `domains renew <domain>`      | Renew a domain               | Done   |
| `domains reactivate <domain>` | Reactivate an expired domain | Done   |
| `domains contacts <domain>`   | Manage domain contacts       | Done   |

### DNS (`namecheap dns`)

| Command                           | Description             | Status |
| --------------------------------- | ----------------------- | ------ |
| `dns list <domain>`               | List DNS records        | Done   |
| `dns add <domain>`                | Add a DNS record        | Done   |
| `dns set <domain>`                | Update a DNS record     | Done   |
| `dns rm <domain>`                 | Delete a DNS record     | Done   |
| `dns email list <domain>`         | List email forwards     | Done   |
| `dns email add <domain>`          | Add email forwarding    | Done   |
| `dns email rm <domain> <mailbox>` | Remove email forwarding | Done   |

### Nameservers (`namecheap ns`)

| Command                        | Description                 | Status |
| ------------------------------ | --------------------------- | ------ |
| `ns list <domain>`             | List nameservers            | Done   |
| `ns set <domain> <ns...>`      | Set custom nameservers      | Done   |
| `ns reset <domain>`            | Reset to Namecheap defaults | Done   |
| `ns create <domain> <ns> <ip>` | Create child nameserver     | Done   |
| `ns delete <domain> <ns>`      | Delete child nameserver     | Done   |
| `ns info <domain> <ns>`        | Get nameserver details      | Done   |
| `ns update <domain> <ns> <ip>` | Update nameserver IP        | Done   |

### WhoisGuard (`namecheap whoisguard`)

| Command                          | Description                   | Status |
| -------------------------------- | ----------------------------- | ------ |
| `whoisguard list`                | List WhoisGuard subscriptions | Done   |
| `whoisguard enable <domain>`     | Enable WhoisGuard for domain  | Done   |
| `whoisguard disable <domain>`    | Disable WhoisGuard for domain | Done   |
| `whoisguard allot <id> <domain>` | Assign WhoisGuard to domain   | Done   |
| `whoisguard unallot <id>`        | Remove WhoisGuard from domain | Done   |
| `whoisguard renew <id>`          | Renew WhoisGuard subscription | Done   |

## Future Plans

### Phase 6: Domain Transfers

- `transfers list` - List pending transfers
- `transfers create <domain>` - Initiate domain transfer
- `transfers status <domain>` - Check transfer status
- `transfers update <domain> <action>` - Update transfer (cancel, resubmit)

### Phase 7: SSL Certificates

- `ssl list` - List SSL certificates
- `ssl info <id>` - Get certificate details
- `ssl create <type>` - Purchase new certificate
- `ssl activate <id>` - Activate certificate
- `ssl renew <id>` - Renew certificate
- `ssl reissue <id>` - Reissue certificate
- `ssl revoke <id>` - Revoke certificate

## API Coverage

| API Namespace                  | Coverage                    |
| ------------------------------ | --------------------------- |
| `namecheap.domains.*`          | Full                        |
| `namecheap.domains.dns.*`      | Full                        |
| `namecheap.domains.ns.*`       | Full                        |
| `namecheap.users.*`            | Partial (balances, pricing) |
| `namecheap.whoisguard.*`       | Full                        |
| `namecheap.domains.transfer.*` | Planned                     |
| `namecheap.ssl.*`              | Planned                     |

## Contributing

See the main README for development setup instructions.
