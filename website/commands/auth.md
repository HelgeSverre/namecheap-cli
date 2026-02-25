# Auth

Manage authentication with the Namecheap API. These commands handle storing and validating your API credentials.

## login

Authenticate with the Namecheap API. Credentials are validated against the API before being saved.

**Usage:**

```bash
namecheap auth login [options]
```

**Options:**

| Option | Description |
|---|---|
| `--api-user <user>` | API username |
| `--api-key <key>` | API key |
| `--username <user>` | Namecheap username (if different from API user) |
| `--client-ip <ip>` | Your whitelisted IP address (auto-detected if not provided) |
| `--sandbox` | Use sandbox environment |
| `--no-sandbox` | Use production environment |

If `--api-user` and `--api-key` are not provided, an interactive prompt will guide you through the login process.

**Example (interactive):**

```bash
$ namecheap auth login
? API Username: myuser
? API Key: ********
? Client IP (auto-detected: 203.0.113.42): 203.0.113.42
? Use sandbox? No
Validating credentials...
✔ Successfully authenticated with Namecheap
Config saved to /home/myuser/.config/namecheap-cli/config.json
```

**Example (non-interactive):**

```bash
$ namecheap auth login --api-user myuser --api-key abc123 --client-ip 203.0.113.42
Validating credentials...
✔ Successfully authenticated with Namecheap
```

## logout

Clear stored authentication credentials from the local configuration.

**Usage:**

```bash
namecheap auth logout
```

**Example:**

```bash
$ namecheap auth logout
✔ Successfully logged out
```

## status

Check the current authentication status and display account information including balance.

**Usage:**

```bash
namecheap auth status [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap auth status
✔ Authenticated

  User:      myuser
  API User:  myuser
  Client IP: 203.0.113.42
  Mode:      Production

  Balance:   USD 125.50

Config: /home/myuser/.config/namecheap-cli/config.json
```

**Example (JSON):**

```bash
$ namecheap auth status --json
{
  "authenticated": true,
  "user": "myuser",
  "apiUser": "myuser",
  "clientIp": "203.0.113.42",
  "sandbox": false,
  "configPath": "/home/myuser/.config/namecheap-cli/config.json",
  "balance": {
    "available": 125.50,
    "total": 130.00,
    "currency": "USD"
  }
}
```
