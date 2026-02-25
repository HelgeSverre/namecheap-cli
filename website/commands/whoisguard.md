# WhoisGuard

Manage WhoisGuard privacy protection for your domains. WhoisGuard masks your personal WHOIS information to protect your privacy.

## list

List all WhoisGuard subscriptions in your account.

**Usage:**

```bash
namecheap whoisguard list [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |
| `--page <n>` | Page number (default: `1`) |
| `--page-size <n>` | Results per page (default: `20`) |

**Example:**

```bash
$ namecheap whoisguard list
ID      Domain          Status    Enabled  Expires
12345   example.com     ✔ Active  ✔ Yes    2026-05-14
12346   mysite.org      ✔ Active  ✔ Yes    2025-11-22
12347   (unassigned)    ✔ Active  ✘ No     2026-03-01

Total: 3 subscription(s)
```

## enable

Enable WhoisGuard privacy protection for a domain. The domain must already have a WhoisGuard subscription assigned to it.

**Usage:**

```bash
namecheap whoisguard enable <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--email <email>` | Forwarding email address for private contact |
| `--json` | Output as JSON |

If `--email` is not provided, you will be prompted to enter one interactively.

**Example:**

```bash
$ namecheap whoisguard enable example.com --email privacy@example.com
✔ WhoisGuard enabled for example.com
```

**Example (interactive):**

```bash
$ namecheap whoisguard enable example.com
? Forwarding email address: privacy@example.com
✔ WhoisGuard enabled for example.com
```

## disable

Disable WhoisGuard privacy protection for a domain. This will expose your WHOIS information publicly.

**Usage:**

```bash
namecheap whoisguard disable <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `-y, --yes` | Skip confirmation |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap whoisguard disable example.com
Warning: Disabling WhoisGuard will expose your WHOIS information.
? Disable WhoisGuard for example.com? Yes
✔ WhoisGuard disabled for example.com
```

## allot

Assign a WhoisGuard subscription to a domain. Use `whoisguard list` to find unassigned subscription IDs.

**Usage:**

```bash
namecheap whoisguard allot <whoisguard-id> <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `whoisguard-id` | WhoisGuard subscription ID |
| `domain` | Domain to assign WhoisGuard to |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap whoisguard allot 12347 newsite.com
✔ WhoisGuard 12347 assigned to newsite.com
```

## unallot

Remove a WhoisGuard subscription from its assigned domain. This removes privacy protection from the domain.

**Usage:**

```bash
namecheap whoisguard unallot <whoisguard-id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `whoisguard-id` | WhoisGuard subscription ID |

**Options:**

| Option | Description |
|---|---|
| `-y, --yes` | Skip confirmation |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap whoisguard unallot 12347
Warning: This will remove WhoisGuard protection from the domain.
? Remove WhoisGuard 12347 from its domain? Yes
✔ WhoisGuard 12347 removed from domain
```

## renew

Renew a WhoisGuard subscription.

**Usage:**

```bash
namecheap whoisguard renew <whoisguard-id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `whoisguard-id` | WhoisGuard subscription ID |

**Options:**

| Option | Description |
|---|---|
| `--years <n>` | Renewal period, 1-10 (default: `1`) |
| `--promo-code <code>` | Promotional code |
| `-y, --yes` | Skip confirmation |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap whoisguard renew 12345 --years 2
WhoisGuard ID: 12345
Renewal period: 2 years

? Renew WhoisGuard 12345 for 2 years? Yes
✔ WhoisGuard 12345 renewed successfully!

  Order ID: 1234570
  Charged: $5.88
```
