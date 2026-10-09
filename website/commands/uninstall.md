# Uninstall

Remove everything the CLI has written to your machine: the config file with your stored API credentials, any installed shell completion scripts, and the update-check cache.

The CLI cannot uninstall its own package, so it finishes by printing the exact command for the package manager it was installed with.

**Usage:**

```bash
namecheap uninstall [options]
```

**Options:**

| Option | Description |
|---|---|
| `--dry-run` | Show what would be removed without removing anything |
| `--force` | Skip confirmation prompt |
| `-y, --yes` | Skip confirmation prompt (alias for `--force`) |
| `--json` | Output as JSON |

**What gets removed (only if present):**

| Item | Location |
|---|---|
| Config and API credentials | `~/.config/namecheap-cli/config.json` (or `$NAMECHEAP_CLI_CONFIG_DIR/config.json`) |
| Bash completions | `~/.local/share/bash-completion/completions/namecheap`, `$(brew --prefix)/etc/bash_completion.d/namecheap` |
| Zsh completions | `~/.zsh/completions/_namecheap`, `$(brew --prefix)/share/zsh/site-functions/_namecheap` |
| Fish completions | `~/.config/fish/completions/namecheap.fish` |
| Update-check cache | `~/.config/configstore/update-notifier-@helgesverre/namecheap-cli.json` |

Only these files are deleted. Their directories are removed only when left empty.

**Example:**

```bash
$ namecheap uninstall --dry-run
Dry run - the following would be removed:
  - Config and stored API credentials: /home/myuser/.config/namecheap-cli/config.json
  - zsh completion script: /home/myuser/.zsh/completions/_namecheap

To remove the CLI itself, run:

  npm uninstall -g @helgesverre/namecheap-cli
```

```bash
$ namecheap uninstall
The following will be removed:
  - Config and stored API credentials: /home/myuser/.config/namecheap-cli/config.json
  - zsh completion script: /home/myuser/.zsh/completions/_namecheap

? Remove these files? Stored API credentials cannot be recovered. Yes
✓ Removed config and stored api credentials: /home/myuser/.config/namecheap-cli/config.json
✓ Removed zsh completion script: /home/myuser/.zsh/completions/_namecheap

To remove the CLI itself, run:

  npm uninstall -g @helgesverre/namecheap-cli
```

The printed command matches how the CLI was installed: `npm uninstall -g`, `bun remove -g`, `pnpm remove -g`, `yarn global remove`, or deleting the executable for a standalone binary. Nothing is printed for `npx`/`bunx`, which don't install anything globally.

::: warning
In a non-interactive shell (CI, scripts) the command refuses to delete anything unless you pass `--yes` or `--force`.
:::
