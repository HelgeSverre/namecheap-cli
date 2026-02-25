# Shell Completions

Enable tab completion for the `namecheap` command in your shell for faster command entry.

## Automatic Install

The easiest way to set up completions is the automatic installer, which detects your shell:

```bash
namecheap completions install
```

### Install for a Specific Shell

If you want to target a particular shell:

```bash
namecheap completions install --shell bash
namecheap completions install --shell zsh
namecheap completions install --shell fish
```

### Homebrew (macOS)

On macOS with Homebrew, install completions to Homebrew's completion directories:

```bash
namecheap completions install --homebrew
```

## Manual Setup

If you prefer to set up completions manually, add the appropriate line to your shell configuration file.

### Bash

Add to `~/.bashrc`:

```bash
eval "$(namecheap completions bash)"
```

### Zsh

Add to `~/.zshrc`:

```bash
eval "$(namecheap completions zsh)"
```

### Fish

Add to `~/.config/fish/config.fish`:

```fish
namecheap completions fish | source
```

## Uninstall

To remove shell completions:

```bash
namecheap completions uninstall
```
