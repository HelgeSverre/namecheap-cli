# GitHub Settings - Copy-Paste Values

This file contains exact values to copy-paste into GitHub repository settings.

## Repository Settings

### About Section (Click ⚙️ next to About)

**Description:**
```
Command-line interface for managing Namecheap domains, DNS records, nameservers, and WhoisGuard privacy
```

**Website:**
```
https://www.npmjs.com/package/namecheap-cli
```

**Topics:** (Add each separately)
```
namecheap
cli
dns-management
domain-management
typescript
```

## Repository Details

### General Settings

Navigate to: **Settings** → **General**

#### Features
- ✅ Wikis (optional)
- ✅ Issues
- ✅ Sponsorships (optional)
- ✅ Preserve this repository (optional)
- ✅ Discussions (recommended)
- ✅ Projects (optional)

#### Pull Requests
- ✅ Allow squash merging
- ✅ Allow merge commits
- ✅ Allow rebase merging
- ✅ Always suggest updating pull request branches
- ✅ Allow auto-merge
- ✅ Automatically delete head branches

### Branch Protection Rules

Navigate to: **Settings** → **Branches** → **Add rule**

**Branch name pattern:**
```
main
```

**Settings to enable:**
- ✅ Require a pull request before merging
  - Required approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Status checks that are required:
    - `test`
    - `lint`
    - `typecheck`
- ✅ Require conversation resolution before merging
- ⚠️ Include administrators (optional - disable for solo projects to allow quick fixes)

### Security Settings

Navigate to: **Settings** → **Security** → **Code security and analysis**

#### Dependabot
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Grouped security updates

#### Code scanning
- ✅ CodeQL analysis (optional - requires setup)

#### Secret scanning
- ✅ Secret scanning (available on public repos)
- ✅ Push protection (recommended)

#### Private vulnerability reporting
- ✅ Allow users to privately report security vulnerabilities

### Secrets and Variables

Navigate to: **Settings** → **Secrets and variables** → **Actions**

**Repository secrets to add (if using automated publishing):**

| Name | Value | Description |
|------|-------|-------------|
| `NPM_TOKEN` | `npm_xxxxx...` | npm automation token for publishing |

To generate npm token:
```bash
npm login
npm token create --read-only  # For CI
npm token create             # For publishing
```

## Issue Templates

Navigate to: **Settings** → **Features** → **Issues** → **Set up templates**

### Bug Report Template

**Name:** Bug report
**About:** Create a report to help us improve
**Title:** `[BUG] `
**Labels:** `bug`

**Template content:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment (please complete the following information):**
 - OS: [e.g. macOS 14.0]
 - Node version: [e.g. 18.0.0]
 - CLI version: [e.g. 0.1.0]

**Additional context**
Add any other context about the problem here.
```

### Feature Request Template

**Name:** Feature request
**About:** Suggest an idea for this project
**Title:** `[FEATURE] `
**Labels:** `enhancement`

**Template content:**
```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Question Template

**Name:** Question
**About:** Ask a question about using the CLI
**Title:** `[QUESTION] `
**Labels:** `question`

**Template content:**
```markdown
**Your question**
A clear and concise description of what you're trying to do or understand.

**What have you tried?**
Describe what you've already attempted.

**Environment:**
 - OS: [e.g. macOS 14.0]
 - Node version: [e.g. 18.0.0]
 - CLI version: [e.g. 0.1.0]

**Additional context**
Add any other context about the question here.
```

## Labels

Navigate to: **Issues** → **Labels** → **New label**

Recommended labels (defaults + custom):

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working |
| `documentation` | `#0075ca` | Improvements or additions to documentation |
| `duplicate` | `#cfd3d7` | This issue or pull request already exists |
| `enhancement` | `#a2eeef` | New feature or request |
| `good first issue` | `#7057ff` | Good for newcomers |
| `help wanted` | `#008672` | Extra attention is needed |
| `invalid` | `#e4e669` | This doesn't seem right |
| `question` | `#d876e3` | Further information is requested |
| `wontfix` | `#ffffff` | This will not be worked on |
| `dependencies` | `#0366d6` | Pull requests that update a dependency |
| `security` | `#ee0701` | Security related issues |
| `breaking change` | `#b60205` | Breaking change in API |
| `needs triage` | `#ededed` | Needs initial evaluation |

## Discussions Categories

Navigate to: **Discussions** → **Categories** → **New category**

Suggested categories:

| Name | Description | Format |
|------|-------------|--------|
| 💡 Ideas | Share ideas for new features | Open-ended discussion |
| 🗣️ General | Chat about anything and everything | Open-ended discussion |
| 🙏 Q&A | Ask the community for help | Question/Answer |
| 🙌 Show and tell | Show off something you've built | Announcement |
| 📣 Announcements | Updates from maintainers | Announcement |

## Social Preview Image

Navigate to: **Settings** → **General** → **Social preview**

**Recommended dimensions:** 1280x640 pixels (PNG or JPG)

**Content suggestions:**
- Project name: "Namecheap CLI"
- Tagline: "Manage your domains from the command line"
- Technology badges/logos
- GitHub username/logo

**Tools to create:**
- [Canva](https://www.canva.com) (free templates)
- [Figma](https://www.figma.com) (free design tool)
- [OG Image Generator](https://og-image.vercel.app/) (automated)

## Release Settings

Navigate to: **Releases** → **Create a new release**

**Tag version:** `v0.1.0`

**Release title:** `v0.1.0 - Initial Release`

**Description:** (Copy from CHANGELOG.md)
```markdown
## 🎉 Initial Release

This is the first public release of namecheap-cli, a command-line interface for managing Namecheap domains.

### Features

- **Authentication** - Secure API key management
- **Domain Management** - Register, renew, lock/unlock domains
- **DNS Records** - Full CRUD operations for all record types
- **Nameservers** - Custom nameservers and child nameserver (glue records)
- **WhoisGuard** - Privacy protection management
- **Email Forwarding** - Configure email forwarding rules
- **Multi-format Output** - Table and JSON output formats
- **Sandbox Mode** - Test safely without affecting production

### Installation

```bash
npm install -g namecheap-cli
```

### Quick Start

```bash
namecheap auth login
namecheap domains list
namecheap dns list example.com
```

See the [README](https://github.com/helge/namecheap-cli#readme) for full documentation.
```

**Options:**
- ✅ Set as the latest release
- ✅ Create a discussion for this release (optional)

## GitHub Actions Workflows

Already configured in `.github/workflows/`:

- `ci.yml` - Continuous Integration (lint, test, build)
- `release.yml` - Automated releases (optional)

Ensure workflow permissions are enabled:
Navigate to: **Settings** → **Actions** → **General**

**Workflow permissions:**
- ⚪ Read repository contents and packages permissions
- ⚪ Read and write permissions (if using automated publishing)

## Quick Setup Checklist

Use this checklist to set up your repository:

- [ ] Set repository description
- [ ] Add 5 topics
- [ ] Set website URL
- [ ] Enable Issues
- [ ] Enable Discussions (optional)
- [ ] Create issue templates (Bug, Feature, Question)
- [ ] Add labels
- [ ] Configure branch protection for `main`
- [ ] Enable Dependabot alerts
- [ ] Enable secret scanning
- [ ] Add NPM_TOKEN secret (for automated publishing)
- [ ] Create social preview image (optional)
- [ ] Set up discussion categories (if enabled)

---

**Last Updated:** 2025-01-21

**Need Help?** See [GITHUB_SETUP.md](./GITHUB_SETUP.md) for detailed explanations.