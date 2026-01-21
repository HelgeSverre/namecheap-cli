# GitHub Repository Setup Guide

This document provides the recommended GitHub repository configuration for `namecheap-cli`.

## Repository Description

```
Command-line interface for managing Namecheap domains, DNS records, nameservers, and WhoisGuard privacy
```

## Repository Topics

Add these topics to improve discoverability (maximum 5):

1. `namecheap`
2. `cli`
3. `dns-management`
4. `domain-management`
5. `typescript`

## About Section

**Website**: `https://www.npmjs.com/package/namecheap-cli`

**Description**: Command-line interface for managing Namecheap domains, DNS records, nameservers, and WhoisGuard privacy

## Repository Settings

### General

- **Features**
  - ✅ Issues (for bug reports and feature requests)
  - ✅ Discussions (for community support and Q&A)
  - ✅ Projects (for roadmap tracking)
  - ✅ Wiki (optional - for extended documentation)

- **Pull Requests**
  - ✅ Allow squash merging
  - ✅ Allow merge commits
  - ✅ Automatically delete head branches

### Branch Protection Rules (for `main` branch)

- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass before merging
  - Required checks: `test`, `lint`, `typecheck`
- ✅ Require branches to be up to date before merging
- ✅ Include administrators (optional)

### Security

- ✅ Enable Dependabot security updates
- ✅ Enable Dependabot version updates
- ✅ Enable private vulnerability reporting

### GitHub Actions

Ensure these secrets are configured for CI/CD:

- `NPM_TOKEN` - For automated npm publishing (optional)

## Issue Templates

Create issue templates for:

1. **Bug Report** - For reporting bugs
2. **Feature Request** - For suggesting new features
3. **Question** - For general questions

## Labels

Recommended labels:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested
- `wontfix` - This will not be worked on
- `duplicate` - This issue or pull request already exists
- `dependencies` - Pull requests that update a dependency file

## Social Preview

Consider creating a social preview image (1280x640px) with:

- Project name: "Namecheap CLI"
- Tagline: "Manage your domains from the command line"
- Logo or icon
- Tech stack badges (TypeScript, Bun, Commander.js)

## README Badges

The following badges are already included in README.md:

- npm version
- CI status
- License

Consider adding:

- Downloads per month: `[![npm downloads](https://img.shields.io/npm/dm/namecheap-cli.svg)](https://www.npmjs.com/package/namecheap-cli)`
- Bundle size: `[![Bundle Size](https://img.shields.io/bundlephobia/min/namecheap-cli)](https://bundlephobia.com/package/namecheap-cli)`
- Node version: `[![Node Version](https://img.shields.io/node/v/namecheap-cli)](https://nodejs.org)`

## npm Package Setup

### Publishing Checklist

Before publishing to npm:

1. ✅ Update version in `package.json`
2. ✅ Update `CHANGELOG.md` with release notes
3. ✅ Run `bun run check` (lint, format, typecheck)
4. ✅ Run `bun test` (all tests passing)
5. ✅ Run `bun run build` (verify build)
6. ✅ Create git tag: `git tag v0.1.0`
7. ✅ Push tag: `git push origin v0.1.0`
8. ✅ Publish: `npm publish`
9. ✅ Create GitHub release with tag and changelog

### npm Configuration

Ensure your `.npmrc` or npm account is configured:

```bash
# Login to npm (one time)
npm login

# Verify you're logged in
npm whoami

# Publish (from project root)
npm publish
```

### Package Visibility

- **Public package** (recommended) - Free, accessible to everyone
- Private package - Requires npm Pro or Teams subscription

## Documentation

### Required Files

- ✅ `README.md` - Main documentation
- ✅ `LICENSE` - MIT License
- ✅ `CHANGELOG.md` - Version history
- ✅ `CONTRIBUTING.md` - Contribution guidelines (optional)
- ✅ `CODE_OF_CONDUCT.md` - Community standards (optional)

### Extended Documentation

Consider adding to `docs/`:

- ✅ `docs/roadmap.md` - Feature roadmap (already exists)
- ✅ `docs/cli-frameworks-research.md` - Technical research (already exists)
- ✅ `docs/api-links.txt` - API reference links (already exists)
- `docs/SECURITY.md` - Security policy
- `docs/FAQ.md` - Frequently asked questions
- `docs/TROUBLESHOOTING.md` - Common issues and solutions

## Community Health Files

Create these in `.github/` directory:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/FUNDING.yml` (if accepting sponsorships)

## Release Process

### Semantic Versioning

Follow [SemVer](https://semver.org/):

- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (0.1.0) - New features (backward compatible)
- **PATCH** (0.1.1) - Bug fixes (backward compatible)

### Release Workflow

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `git commit -am "Release v0.1.0"`
4. Tag: `git tag v0.1.0`
5. Push: `git push && git push --tags`
6. Build: `bun run build`
7. Publish: `npm publish`
8. Create GitHub Release with changelog notes

### Automated Releases (Optional)

Consider using:

- **semantic-release** - Automated semantic versioning and changelog
- **release-please** - Google's automated release tool
- **GitHub Actions** - Automated publishing on tag push

## Marketing & Promotion

After publishing:

1. Tweet about the release
2. Post on relevant Reddit communities (r/node, r/webdev)
3. Share on Hacker News (Show HN)
4. Write a blog post about the project
5. Add to awesome lists (awesome-cli-apps, awesome-nodejs)
6. Update personal portfolio/website

## Maintenance

### Regular Tasks

- Review and respond to issues within 48 hours
- Merge dependabot PRs weekly
- Update dependencies monthly
- Review and update documentation quarterly
- Monitor npm download statistics
- Check for security vulnerabilities

### Metrics to Track

- npm downloads per week/month
- GitHub stars and forks
- Open vs. closed issues
- Community contributions
- User feedback and satisfaction

## Support Channels

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Community Q&A
- Twitter/X - Updates and announcements
- Email - Direct support (optional)

## License

MIT License - Open source, commercial use allowed

---

**Note**: This is a living document. Update as the project evolves.