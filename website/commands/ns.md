# Nameservers

Manage nameservers for your domains. Set custom nameservers, reset to Namecheap defaults, and manage child nameservers (glue records).

## list

List the current nameservers for a domain.

**Usage:**

```bash
namecheap ns list <domain> [options]
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
$ namecheap ns list example.com

Nameservers for example.com

Using Namecheap BasicDNS

  1. dns1.registrar-servers.com
  2. dns2.registrar-servers.com
```

**Example (custom nameservers):**

```bash
$ namecheap ns list mysite.org

Nameservers for mysite.org

Using custom nameservers

  1. ns1.cloudflare.com
  2. ns2.cloudflare.com
```

## set

Set custom nameservers for a domain. Requires at least 2 and at most 5 nameservers.

**Usage:**

```bash
namecheap ns set <domain> <nameservers...>
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `nameservers` | 2-5 nameserver hostnames |

**Example:**

```bash
$ namecheap ns set example.com ns1.cloudflare.com ns2.cloudflare.com
✔ Set 2 nameservers for example.com
  1. ns1.cloudflare.com
  2. ns2.cloudflare.com
```

## reset

Reset nameservers back to Namecheap defaults (BasicDNS). Requires confirmation unless `--force` is used.

**Usage:**

```bash
namecheap ns reset <domain> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |

**Options:**

| Option | Description |
|---|---|
| `--force` | Skip confirmation prompt |

**Example:**

```bash
$ namecheap ns reset example.com
? Are you sure you want to reset nameservers to Namecheap defaults for example.com? Yes
✔ Reset nameservers for example.com to Namecheap defaults
```

## create

Create a child nameserver (glue record) under your domain.

**Usage:**

```bash
namecheap ns create <domain> <nameserver> <ip> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name (e.g., `example.com`) |
| `nameserver` | Nameserver hostname (e.g., `ns1.example.com`) |
| `ip` | IP address for the nameserver |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap ns create example.com ns1.example.com 203.0.113.10
✔ Child nameserver created: ns1.example.com -> 203.0.113.10
```

## delete

Delete a child nameserver (glue record).

**Usage:**

```bash
namecheap ns delete <domain> <nameserver> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `nameserver` | Nameserver hostname to delete |

**Options:**

| Option | Description |
|---|---|
| `-y, --yes` | Skip confirmation |
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap ns delete example.com ns1.example.com
? Delete nameserver ns1.example.com? Yes
✔ Child nameserver deleted: ns1.example.com
```

## info

Get information about a child nameserver, including its IP address and statuses.

**Usage:**

```bash
namecheap ns info <domain> <nameserver> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `nameserver` | Nameserver hostname |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap ns info example.com ns1.example.com

Nameserver Information

  Hostname:   ns1.example.com
  IP Address: 203.0.113.10
  Statuses:   ok
```

## update

Update the IP address of an existing child nameserver.

**Usage:**

```bash
namecheap ns update <domain> <nameserver> <ip> [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `domain` | Domain name |
| `nameserver` | Nameserver hostname |
| `ip` | New IP address |

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON |

**Example:**

```bash
$ namecheap ns update example.com ns1.example.com 203.0.113.20
Current IP: 203.0.113.10
New IP: 203.0.113.20
✔ Nameserver updated: ns1.example.com -> 203.0.113.20
```
