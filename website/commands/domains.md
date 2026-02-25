# Domains

Manage your Namecheap domains. List, inspect, register, renew, lock/unlock, and manage contacts for your domains.

## list

List all domains in your Namecheap account.

**Usage:**

```bash
namecheap domains list [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |
| `--page <number>` | Page number (default: `1`) |
| `--page-size <number>` | Results per page (default: `20`) |

**Example:**

```bash
$ namecheap domains list
Domain          Expires     Auto-Renew  Locked    WhoisGuard  DNS
example.com     2026-05-14  ✔ Yes       ✔ Locked  ✔ Enabled   Namecheap
mysite.org      2025-11-22  ✘ No        ✔ Locked  ✔ Enabled   Custom
coolproject.io  2026-01-03  ✔ Yes       ✘ Unlocked ✔ Enabled  Namecheap

Total: 3 domain(s)
```

## info

Get detailed information about a specific domain.

**Usage:**

```bash
namecheap domains info <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name to get info for |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap domains info example.com

example.com

  Status:       ✔ Active
  Owner:        John Doe
  Created:      2020-03-15
  Expires:      2026-05-14
  Premium:      ✘ No

DNS
  Provider:     Namecheap BasicDNS

WhoisGuard
  Status:       ✔ Enabled
  Expires:      2026-05-14
```

## check

Check domain availability for registration. Supports checking multiple domains at once.

**Usage:**

```bash
namecheap domains check <domains...> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domains` | One or more domain names to check |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap domains check example.com coolstartup.io mysite.dev
Domain          Available  Premium  Price
example.com     Taken      No       -
coolstartup.io  Available  No       -
mysite.dev      Available  Yes      $12.98
```

## lock

Enable registrar lock on a domain to prevent unauthorized transfers.

**Usage:**

```bash
namecheap domains lock <domain>
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name to lock |

**Example:**

```bash
$ namecheap domains lock example.com
✔ Successfully locked example.com
```

## unlock

Disable registrar lock on a domain, typically needed before transferring to another registrar.

**Usage:**

```bash
namecheap domains unlock <domain>
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name to unlock |

**Example:**

```bash
$ namecheap domains unlock example.com
✔ Successfully unlocked example.com
```

## register

Register a new domain. Checks availability first, then prompts for contact information.

**Usage:**

```bash
namecheap domains register <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain to register (e.g., `example.com`) |

**Options:**

| Option | Description |
|---|---|
| `--years <n>` | Registration period, 1-10 (default: `1`) |
| `--nameservers <ns1,ns2>` | Custom nameservers (comma-separated) |
| `--no-whoisguard` | Disable WhoisGuard privacy |
| `--promo-code <code>` | Promotional code |
| `--contact-file <path>` | JSON file with contact info |
| `--dry-run` | Check availability and price without registering |
| `--json` | Output as JSON |
| `-y, --yes` | Skip confirmation prompts (requires `--contact-file`) |

**Example:**

```bash
$ namecheap domains register coolstartup.io --years 2
✔ Domain coolstartup.io is available!

Enter registrant contact information:
? First Name: John
? Last Name: Doe
? Email: john@example.com
? Phone: +1.5551234567
? Address Line 1: 123 Main St
? City: San Francisco
? State/Province: CA
? Postal Code: 94102
? Country Code: US

Registration summary:
  Domain: coolstartup.io
  Years: 2
  WhoisGuard: Enabled

? Proceed with registration? Yes
✔ Domain coolstartup.io registered successfully!

  Order ID: 1234567
  Domain ID: 98765
  Charged: $45.98
  WhoisGuard: Enabled
```

**Example (dry run):**

```bash
$ namecheap domains register coolstartup.io --dry-run
✔ Domain coolstartup.io is available!
Dry run - domain not registered.
```

## renew

Renew a domain registration.

**Usage:**

```bash
namecheap domains renew <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain to renew |

**Options:**

| Option | Description |
|---|---|
| `--years <n>` | Renewal period, 1-10 (default: `1`) |
| `--promo-code <code>` | Promotional code |
| `--json` | Output as JSON |
| `-y, --yes` | Skip confirmation |

**Example:**

```bash
$ namecheap domains renew example.com --years 2
Domain: example.com
Current expiry: 2026-05-14
Renewal period: 2 years

? Renew example.com for 2 years? Yes
✔ Domain example.com renewed successfully!

  Order ID: 1234568
  Charged: $19.98
  New expiry: 2028-05-14
```

## reactivate

Reactivate an expired domain. Additional fees may apply.

**Usage:**

```bash
namecheap domains reactivate <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain to reactivate |

**Options:**

| Option | Description |
|---|---|
| `--years <n>` | Renewal period after reactivation, 1-10 (default: `1`) |
| `--promo-code <code>` | Promotional code |
| `--json` | Output as JSON |
| `-y, --yes` | Skip confirmation |

**Example:**

```bash
$ namecheap domains reactivate expired-domain.com
Warning: Domain reactivation may have additional fees.
Domain: expired-domain.com
Renewal period: 1 year

? Reactivate expired-domain.com? This will charge your account. Yes
✔ Domain expired-domain.com reactivated successfully!

  Order ID: 1234569
  Charged: $29.98
```

## contacts

Get or set domain contact information (registrant, tech, admin, billing).

**Usage:**

```bash
namecheap domains contacts <domain> [action] [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `action` | `get` (default) or `set` |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |
| `--type <type>` | Contact type: `registrant`, `tech`, `admin`, `auxbilling` |
| `--file <path>` | JSON file with contact info (for `set` action) |

**Example (get contacts):**

```bash
$ namecheap domains contacts example.com

Registrant Contact:
  Name: John Doe
  Email: john@example.com
  Phone: +1.5551234567
  Address: 123 Main St
           San Francisco, CA 94102
           US

Tech Contact:
  Name: John Doe
  Email: john@example.com
  ...
```

**Example (get specific contact type):**

```bash
$ namecheap domains contacts example.com --type registrant --json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1.5551234567",
  "address1": "123 Main St",
  "city": "San Francisco",
  "stateProvince": "CA",
  "postalCode": "94102",
  "country": "US"
}
```

**Example (set contacts from file):**

```bash
$ namecheap domains contacts example.com set --file contacts.json
? Update contacts for example.com? Yes
✔ Contacts updated for example.com
```
