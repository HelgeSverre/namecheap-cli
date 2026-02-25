# namecheap-cli VitePress Website Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

A VitePress documentation site with a custom Vue-powered homepage inside `website/` at the repo root. Combines a marketing landing page with full command documentation.

## Tech Stack

- **VitePress** (latest) — static site generator for docs
- **Vue 3** — custom homepage component
- **pnpm** — package manager
- **CSS** — scoped styles using VitePress CSS variables (no Tailwind)
- **Deployment** — GitHub Pages ready

## Structure

```
website/
├── .vitepress/
│   ├── config.ts              # Site config, nav, sidebar
│   └── theme/
│       ├── index.ts           # Custom theme registration
│       ├── HomePage.vue       # Custom landing page component
│       └── style.css          # Custom global styles
├── index.md                   # Landing page (uses HomePage layout)
├── guide/
│   ├── getting-started.md     # Install, auth setup, first commands
│   ├── configuration.md       # Config options, sandbox mode, output formats
│   └── shell-completions.md   # Shell completion setup
├── commands/
│   ├── auth.md                # Auth commands
│   ├── domains.md             # Domain management commands
│   ├── dns.md                 # DNS record commands
│   ├── ns.md                  # Nameserver commands
│   ├── users.md               # Account/user commands
│   ├── whoisguard.md          # WhoisGuard privacy commands
│   └── config.md              # Config commands
├── package.json
└── tsconfig.json
```

## Homepage Design (Custom Vue Component)

Dark-themed, developer-focused landing page with Namecheap orange accent (#FE5803).

### Section 1: Hero
- Large heading: "Manage Namecheap from your terminal"
- Subheading: brief description of what the CLI does
- Install command with copy button: `npm install -g namecheap-cli`
- Two CTA buttons: "Get Started" (links to /guide/getting-started) and "View on GitHub"

### Section 2: Terminal Demo
- Styled terminal window with dark background
- Shows a realistic CLI session:
  - `$ namecheap domains list` → table output
  - `$ namecheap dns list example.com` → DNS records table
- Static display with syntax highlighting (no animation for simplicity)

### Section 3: Feature Grid
Six cards in a 3x2 grid:
1. **Domain Management** — List, register, renew, lock/unlock domains
2. **DNS Records** — Add, update, delete DNS records and email forwarding
3. **WhoisGuard Privacy** — Enable/disable privacy protection
4. **Shell Completions** — Tab completion for bash, zsh, and fish
5. **JSON Output** — Machine-readable output for scripting
6. **Sandbox Mode** — Test safely with Namecheap sandbox API

### Section 4: Quick Install
- Tab switcher for package managers (npm / yarn / pnpm / bun)
- Copy-able install commands
- "Run without installing" alternative (npx/bunx)

### Section 5: Footer
- Links to GitHub, npm, documentation
- MIT license notice

## Docs Content

Content pulled from existing README.md and expanded:

### Guide Section
- **Getting Started** — Prerequisites, installation, API credentials setup, first commands
- **Configuration** — Config options, sandbox mode, output formats, environment details
- **Shell Completions** — Install/uninstall for bash/zsh/fish, Homebrew support

### Commands Section
One page per command group with:
- Command synopsis and description
- All subcommands with flags and options
- Usage examples with expected output
- Notes on edge cases

## Color Scheme

- Primary accent: `#FE5803` (Namecheap orange)
- Secondary: `#FF8C44` (lighter orange)
- Dark background for terminal/hero sections
- VitePress default light/dark mode support
