# Configuration

## Config Commands

Manage your CLI configuration with the `config` command group:

```bash
namecheap config list              # Show all config values
namecheap config get <key>         # Get a specific value
namecheap config set <key> <value> # Set a value
namecheap config path              # Show the config file path
```

## Config Options

| Option | Values | Description |
|---|---|---|
| `sandbox` | `true` / `false` | Use the sandbox API for testing |
| `output` | `table` / `json` | Default output format |

## Output Formats

### Table Output (Default)

By default, all commands display results in a formatted table:

```bash
namecheap domains list
```

### JSON Output

Add the `--json` flag to any command to get JSON output instead:

```bash
namecheap domains list --json
```

### Setting the Default Format

If you prefer JSON output by default, set it in the config:

```bash
namecheap config set output json
```

You can still override the default with the `--json` flag on individual commands.

## Sandbox Mode

Namecheap provides a sandbox environment for testing API calls without affecting your production account.

### Enable Sandbox Mode

```bash
namecheap config set sandbox true
```

### Authenticate with Sandbox Credentials

After enabling sandbox mode, authenticate with your sandbox account credentials:

```bash
namecheap auth login
```

::: tip
Sandbox credentials are separate from your production credentials. Create a sandbox account at [sandbox.namecheap.com](https://www.sandbox.namecheap.com).
:::

### Test Commands

Once authenticated, all commands will use the sandbox API:

```bash
namecheap domains list
```

### Disable Sandbox Mode

To switch back to production:

```bash
namecheap config set sandbox false
```
