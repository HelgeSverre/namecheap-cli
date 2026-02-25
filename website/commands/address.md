# Address

Manage saved addresses for domain registrations and contacts.

## list

List all saved addresses in your account.

**Usage:**

```bash
namecheap address list [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address list

ID    Name          Default  Email
1234  Home Address  Yes      john@example.com
5678  Work Address  No       john@work.com
```

## info

Get details of a saved address.

**Usage:**

```bash
namecheap address info <id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `id` | Address ID |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address info 1234

Name:         Home Address
Default:      Yes
Email:        john@example.com
First Name:   John
Last Name:    Doe
Address:      123 Main St
City:         New York
State:        NY
ZIP:          10001
Country:      US
Phone:        +1.5555551234
```

## create

Create a new saved address.

**Usage:**

```bash
namecheap address create [options]
```

**Required Options:**

| Option | Description |
|---|---|
| `--name <name>` | Address name |
| `--email <email>` | Email address |
| `--first-name <name>` | First name |
| `--last-name <name>` | Last name |
| `--address1 <address>` | Address line 1 |
| `--city <city>` | City |
| `--state <state>` | State/Province |
| `--zip <zip>` | ZIP/Postal code |
| `--country <country>` | Country code (e.g., `US`, `CA`) |
| `--phone <phone>` | Phone number (e.g., `+1.5555551234`) |

**Optional Options:**

| Option | Description |
|---|---|
| `--default` | Set as default address |
| `--job-title <title>` | Job title |
| `--organization <org>` | Organization name |
| `--address2 <address>` | Address line 2 |
| `--state-choice <state>` | State choice (defaults to `--state` value) |
| `--phone-ext <ext>` | Phone extension |
| `--fax <fax>` | Fax number |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address create \
    --name "Home Address" \
    --email john@example.com \
    --first-name John \
    --last-name Doe \
    --address1 "123 Main St" \
    --city "New York" \
    --state NY \
    --zip 10001 \
    --country US \
    --phone "+1.5555551234" \
    --default
✔ Address created successfully (ID: 1234)
```

## update

Update an existing saved address. All required fields must be provided (the API replaces the entire address).

**Usage:**

```bash
namecheap address update <id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `id` | Address ID to update |

**Required Options:**

| Option | Description |
|---|---|
| `--name <name>` | Address name |
| `--email <email>` | Email address |
| `--first-name <name>` | First name |
| `--last-name <name>` | Last name |
| `--address1 <address>` | Address line 1 |
| `--city <city>` | City |
| `--state <state>` | State/Province |
| `--zip <zip>` | ZIP/Postal code |
| `--country <country>` | Country code (e.g., `US`, `CA`) |
| `--phone <phone>` | Phone number (e.g., `+1.5555551234`) |

**Optional Options:**

| Option | Description |
|---|---|
| `--default` | Set as default address |
| `--job-title <title>` | Job title |
| `--organization <org>` | Organization name |
| `--address2 <address>` | Address line 2 |
| `--state-choice <state>` | State choice (defaults to `--state` value) |
| `--phone-ext <ext>` | Phone extension |
| `--fax <fax>` | Fax number |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address update 1234 \
    --name "Updated Address" \
    --email john@example.com \
    --first-name John \
    --last-name Doe \
    --address1 "456 Oak Ave" \
    --city "Los Angeles" \
    --state CA \
    --zip 90001 \
    --country US \
    --phone "+1.5555551234"
✔ Address updated successfully
```

## delete

Delete a saved address.

**Usage:**

```bash
namecheap address delete <id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `id` | Address ID to delete |

**Options:**

| Option | Description |
|---|---|
| `--force` | Skip confirmation prompt |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address delete 5678
? Are you sure you want to delete address 5678? Yes
✔ Address deleted successfully
```

## set-default

Set an address as the default for domain registrations.

**Usage:**

```bash
namecheap address set-default <id> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `id` | Address ID to set as default |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap address set-default 1234
✔ Address 1234 set as default
```
