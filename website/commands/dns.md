# DNS

Manage DNS records for your domains. Add, update, list, and remove DNS records, as well as manage email forwarding rules.

## list

List all DNS records for a domain.

**Usage:**

```bash
namecheap dns list <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap dns list example.com
ID    Type   Name   Value                  TTL      MX Pref
101   A      @      185.199.108.153        30 min   -
102   A      @      185.199.109.153        30 min   -
103   CNAME  www    example.com            30 min   -
104   MX     @      mx1.example.com        30 min   10
105   MX     @      mx2.example.com        30 min   20
106   TXT    @      v=spf1 include:...     30 min   -

Total: 6 record(s)
```

## add

Add a new DNS record. Supports both interactive and non-interactive modes.

**Usage:**

```bash
namecheap dns add <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--type <type>` | Record type (`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`, etc.) |
| `--name <name>` | Host name (`@` for root, or subdomain like `www`) |
| `--value <value>` | Record value/address |
| `--ttl <seconds>` | TTL in seconds (default: `1800`) |
| `--mx-pref <priority>` | MX priority (for MX records only) |

If `--type`, `--name`, and `--value` are all provided, the record is created directly. Otherwise, an interactive prompt guides you through the process.

**Example (non-interactive):**

```bash
$ namecheap dns add example.com --type A --name blog --value 203.0.113.50
✔ Added A record: blog -> 203.0.113.50
```

**Example (MX record):**

```bash
$ namecheap dns add example.com --type MX --name @ --value mail.example.com --mx-pref 10
✔ Added MX record: @ -> mail.example.com
```

**Example (interactive):**

```bash
$ namecheap dns add example.com
? Record type: A
? Host name (@ for root): staging
? Value/Address: 203.0.113.60
? TTL (seconds): 1800
✔ Added A record: staging -> 203.0.113.60
```

## set

Update an existing DNS record by its ID. Use `dns list` to find record IDs.

**Usage:**

```bash
namecheap dns set <domain> <record-id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `record-id` | Record ID to update (use `dns list` to find IDs) |

**Options:**

| Option | Description |
|---|---|
| `--name <name>` | New host name |
| `--value <value>` | New record value/address |
| `--ttl <seconds>` | New TTL in seconds |
| `--mx-pref <priority>` | New MX priority |

At least one option must be provided.

**Example:**

```bash
$ namecheap dns set example.com 101 --value 203.0.113.99
✔ Updated record 101
```

**Example (update TTL):**

```bash
$ namecheap dns set example.com 103 --ttl 3600
✔ Updated record 103
```

## rm

Remove a DNS record by its ID. Use `dns list` to find record IDs.

**Usage:**

```bash
namecheap dns rm <domain> <record-id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `record-id` | Record ID to remove (use `dns list` to find IDs) |

**Options:**

| Option | Description |
|---|---|
| `--force` | Skip confirmation prompt |

**Example:**

```bash
$ namecheap dns rm example.com 106

Record to delete:
  Type: TXT
  Name: @
  Value: v=spf1 include:...

? Are you sure you want to delete TXT record for @? Yes
✔ Deleted record 106
```

**Example (skip confirmation):**

```bash
$ namecheap dns rm example.com 106 --force
✔ Deleted record 106
```

## email list

List email forwarding rules for a domain.

**Usage:**

```bash
namecheap dns email list <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap dns email list example.com
Mailbox              Forward To
info@example.com     john@gmail.com
support@example.com  team@company.com

2 forwarding rule(s) configured.
```

## email add

Add an email forwarding rule for a domain.

**Usage:**

```bash
namecheap dns email add <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--mailbox <name>` | Email prefix (e.g., `info`) |
| `--forward-to <email>` | Destination email address |
| `--json` | Output as JSON |

If options are not provided, an interactive prompt will ask for them.

**Example:**

```bash
$ namecheap dns email add example.com --mailbox hello --forward-to john@gmail.com
✔ Email forward created: hello@example.com -> john@gmail.com
```

## email rm

Remove an email forwarding rule.

**Usage:**

```bash
namecheap dns email rm <domain> <mailbox> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `mailbox` | Mailbox name to remove (e.g., `info`) |

**Options:**

| Option | Description |
|---|---|
| `--force` | Skip confirmation |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap dns email rm example.com info
? Remove email forward for info@example.com? Yes
✔ Email forward removed: info@example.com
```
