# Users

Manage account information, balances, and pricing. Includes commands for account administration such as creating sub-accounts and managing funds.

## balances

Show account balances including available balance, total balance, and earned amounts.

**Usage:**

```bash
namecheap users balances [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users balances

Available Balance: $125.50
Account Balance:   $130.00
Earned Amount:     $0.00
Withdrawable:      $0.00
Pending:           $0.00
```

## pricing

Get domain pricing for registration, renewal, transfer, or restore operations.

**Usage:**

```bash
namecheap users pricing <action> [tld] [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `action` | Action type: `register`, `renew`, `transfer`, `restore` |
| `tld` | TLD to check (e.g., `com`, `net`, `org`). If omitted, shows all TLDs. |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |
| `--years <n>` | Number of years, 1-10 (default: `1`) |

**Example (specific TLD):**

```bash
$ namecheap users pricing register com
TLD   Action    Duration  Your Price  Regular Price
.com  Register  1 year    $8.88       $10.98
```

**Example (multiple TLDs):**

```bash
$ namecheap users pricing renew
TLD    Action  Duration  Your Price  Regular Price
.com   Renew   1 year    $12.98      $14.98
.net   Renew   1 year    $14.98      $14.98
.org   Renew   1 year    $14.98      $14.98
.io    Renew   1 year    $32.98      $39.98
...

Prices shown for 1 year renew.
```

**Example (multi-year pricing):**

```bash
$ namecheap users pricing register io --years 3
TLD   Action    Duration  Your Price  Regular Price
.io   Register  3 years   $89.94      $119.94
```

## add-funds

Create a request to add funds to your Namecheap account. Returns a URL to complete the payment.

**Usage:**

```bash
namecheap users add-funds [options]
```

**Options:**

| Option | Description |
|---|---|
| `--amount <amount>` | Amount to add in USD (required) |
| `--return-url <url>` | URL to redirect to after payment (required) |
| `--username <username>` | Username (defaults to current user) |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users add-funds --amount 50.00 --return-url https://example.com/done

Token ID:     abc123-token
Redirect URL: https://www.namecheap.com/...

Visit the redirect URL to complete the payment.
```

## funds-status

Get the status of a previously created add-funds request.

**Usage:**

```bash
namecheap users funds-status <token> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `token` | Token ID from a previous `add-funds` request |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users funds-status abc123-token

Transaction ID: TXN-456789
Amount:         $50.00
Status:         ✔ Completed
```

## login

Validate login credentials for API-created sub-user accounts.

**Usage:**

```bash
namecheap users login <username> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `username` | Username to validate |

**Options:**

| Option | Description |
|---|---|
| `--password <password>` | Password to validate (required) |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users login subuser --password mysecret
✔ Login successful for user: subuser
```

## create

Create a new user account under your API account.

**Usage:**

```bash
namecheap users create [options]
```

**Required Options:**

| Option | Description |
|---|---|
| `--username <username>` | Username for the new account |
| `--password <password>` | Password for the new account |
| `--email <email>` | Email address |
| `--first-name <name>` | First name |
| `--last-name <name>` | Last name |
| `--address1 <address>` | Address line 1 |
| `--city <city>` | City |
| `--state <state>` | State/Province |
| `--zip <zip>` | Postal/ZIP code |
| `--country <country>` | Country code (e.g., `US`, `GB`) |
| `--phone <phone>` | Phone number |
| `--accept-terms` | Accept terms and conditions (required) |

**Optional Options:**

| Option | Description |
|---|---|
| `--accept-news` | Accept promotional emails |
| `--job-title <title>` | Job title |
| `--organization <org>` | Organization name |
| `--address2 <address>` | Address line 2 |
| `--phone-ext <ext>` | Phone extension |
| `--fax <fax>` | Fax number |
| `--ignore-duplicate-email` | Ignore duplicate email address |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users create \
    --username newuser \
    --password SecurePass123 \
    --email new@example.com \
    --first-name Jane \
    --last-name Smith \
    --address1 "456 Oak Ave" \
    --city "New York" \
    --state NY \
    --zip 10001 \
    --country US \
    --phone "+1.5559876543" \
    --accept-terms
✔ User created successfully (ID: 12345)
```

## update

Update user account information. All required fields must be provided (the API replaces the entire profile).

**Usage:**

```bash
namecheap users update [options]
```

**Required Options:**

| Option | Description |
|---|---|
| `--email <email>` | Email address |
| `--first-name <name>` | First name |
| `--last-name <name>` | Last name |
| `--address1 <address>` | Address line 1 |
| `--city <city>` | City |
| `--state <state>` | State/Province |
| `--zip <zip>` | Postal/ZIP code |
| `--country <country>` | Country code (e.g., `US`, `GB`) |
| `--phone <phone>` | Phone number |

**Optional Options:**

| Option | Description |
|---|---|
| `--job-title <title>` | Job title |
| `--organization <org>` | Organization name |
| `--address2 <address>` | Address line 2 |
| `--phone-ext <ext>` | Phone extension |
| `--fax <fax>` | Fax number |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users update \
    --email updated@example.com \
    --first-name Jane \
    --last-name Smith \
    --address1 "789 New Address" \
    --city "Los Angeles" \
    --state CA \
    --zip 90001 \
    --country US \
    --phone "+1.5559876543"
✔ User updated successfully (ID: 12345)
```

## change-password

Change the password for a user account. Requires either the current password or a password reset code.

**Usage:**

```bash
namecheap users change-password [options]
```

**Options:**

| Option | Description |
|---|---|
| `--new-password <password>` | New password (required) |
| `--old-password <password>` | Current password (for standard flow) |
| `--reset-code <code>` | Password reset code (for reset flow) |
| `--json` | Output as JSON |

Either `--old-password` or `--reset-code` must be provided, but not both.

**Example:**

```bash
$ namecheap users change-password --old-password OldPass123 --new-password NewPass456
✔ Password changed successfully (User ID: 12345)
```

## reset-password

Request a password reset email for a user account.

**Usage:**

```bash
namecheap users reset-password [options]
```

**Options:**

| Option | Description |
|---|---|
| `--find-by <type>` | How to find the user: `email`, `domain`, `username` (required) |
| `--value <value>` | The email, domain, or username to look up (required) |
| `--email-from-name <name>` | Name to use in the From field of the reset email |
| `--email-from <email>` | Email address to use in the From field |
| `--url-pattern <pattern>` | URL pattern for the reset link |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap users reset-password --find-by email --value user@example.com
✔ Password reset email sent successfully
```
