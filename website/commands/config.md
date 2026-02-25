# Config

Manage CLI configuration settings. Configuration is stored in a JSON file at an OS-appropriate location.

## Available Settings

| Key | Values | Description |
|---|---|---|
| `sandbox` | `true` / `false` | Use the Namecheap sandbox API for testing |
| `defaultOutput` | `table` / `json` | Default output format for all commands |

## list

Display all current configuration values, including credentials (API key is hidden).

**Usage:**

```bash
namecheap config list [options]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap config list

Configuration

  Config file: /home/myuser/.config/namecheap-cli/config.json

  sandbox:       false
  defaultOutput: table

Credentials
  apiUser:  myuser
  userName: myuser
  clientIp: 203.0.113.42
  apiKey:   ***hidden***
```

**Example (JSON):**

```bash
$ namecheap config list --json
{
  "sandbox": false,
  "defaultOutput": "table",
  "configPath": "/home/myuser/.config/namecheap-cli/config.json",
  "credentials": {
    "apiUser": "myuser",
    "userName": "myuser",
    "clientIp": "203.0.113.42",
    "apiKey": "***hidden***"
  }
}
```

## get

Get a single configuration value.

**Usage:**

```bash
namecheap config get <key>
```

**Arguments:**

| Argument | Description |
|---|---|
| `key` | Configuration key (`sandbox`, `defaultOutput`) |

**Example:**

```bash
$ namecheap config get sandbox
false
```

```bash
$ namecheap config get defaultOutput
table
```

## set

Set a configuration value.

**Usage:**

```bash
namecheap config set <key> <value>
```

**Arguments:**

| Argument | Description |
|---|---|
| `key` | Configuration key (`sandbox`, `defaultOutput`) |
| `value` | Value to set |

**Example:**

```bash
$ namecheap config set sandbox true
✔ Set sandbox = true
```

```bash
$ namecheap config set defaultOutput json
✔ Set defaultOutput = json
```

## path

Display the path to the configuration file on disk.

**Usage:**

```bash
namecheap config path
```

**Example:**

```bash
$ namecheap config path
/home/myuser/.config/namecheap-cli/config.json
```

::: tip
The config file location varies by OS:
- **Linux**: `~/.config/namecheap-cli/config.json`
- **macOS**: `~/Library/Preferences/namecheap-cli/config.json`
- **Windows**: `%APPDATA%/namecheap-cli/config.json`
:::
