# Publishing Checklist for namecheap-cli

This checklist ensures a smooth and complete publication process for the namecheap-cli package.

## Pre-Publication Checklist

### Code Quality

- [ ] All tests passing: `bun test`
- [ ] No linting errors: `bun run lint`
- [ ] Code formatted: `bun run format:check`
- [ ] TypeScript compiles: `bun run typecheck`
- [ ] Build succeeds: `bun run build`
- [ ] Run full check suite: `bun run check`

### Documentation

- [ ] README.md is up to date
- [ ] CHANGELOG.md includes all changes for this version
- [ ] All command examples work correctly
- [ ] API requirements documented
- [ ] Installation instructions tested
- [ ] LICENSE file exists (MIT)

### Package Configuration

- [ ] `package.json` version updated (follow SemVer)
- [ ] `package.json` author field filled in
- [ ] `package.json` repository URL correct
- [ ] `package.json` keywords relevant (max 5)
- [ ] `package.json` files field includes only necessary files
- [ ] `.npmignore` excludes dev/test files
- [ ] `.gitignore` excludes sensitive files

### Security

- [ ] No API keys or credentials in code
- [ ] No sensitive information in git history
- [ ] Dependencies audit clean: `bun pm audit` or `npm audit`
- [ ] `.env` files in `.gitignore`
- [ ] Config files with credentials excluded from npm package

### Testing

- [ ] Test on fresh install: `npm pack` then `npm install -g ./namecheap-cli-*.tgz`
- [ ] Test CLI commands work after install
- [ ] Test in sandbox mode
- [ ] Verify `namecheap --help` works
- [ ] Verify `namecheap --version` shows correct version

## Git & GitHub Preparation

### Git Tasks

- [ ] All changes committed
- [ ] Working directory clean: `git status`
- [ ] On correct branch (usually `main`)
- [ ] Pull latest changes: `git pull origin main`
- [ ] No merge conflicts

### GitHub Repository Configuration

- [ ] Repository description set:
  ```
  Command-line interface for managing Namecheap domains, DNS records, nameservers, and WhoisGuard privacy
  ```

- [ ] Repository topics added (max 5):
  - `namecheap`
  - `cli`
  - `dns-management`
  - `domain-management`
  - `typescript`

- [ ] Website URL set: `https://www.npmjs.com/package/namecheap-cli`

- [ ] Features enabled:
  - [ ] Issues
  - [ ] Discussions (optional but recommended)
  - [ ] Projects (optional)

- [ ] Branch protection rules configured for `main`:
  - [ ] Require PR reviews
  - [ ] Require status checks
  - [ ] Require up-to-date branches

- [ ] Dependabot enabled for security updates

### GitHub Release Preparation

- [ ] Draft release notes from CHANGELOG.md
- [ ] Prepare announcement text
- [ ] Screenshots or demo GIFs ready (optional)

## npm Publication

### npm Setup

- [ ] npm account created/logged in: `npm whoami`
- [ ] Two-factor authentication enabled (recommended)
- [ ] Access token generated (if using CI/CD)

### Publishing Steps

1. **Final Build**
   ```bash
   bun run build
   ```

2. **Pack and Test Locally** (recommended)
   ```bash
   npm pack
   npm install -g ./namecheap-cli-*.tgz
   namecheap --version
   namecheap auth status
   ```

3. **Create Git Tag**
   ```bash
   git tag v0.1.0
   ```

4. **Push Commits and Tags**
   ```bash
   git push origin main
   git push origin v0.1.0
   ```

5. **Publish to npm**
   ```bash
   npm publish
   ```

6. **Verify Publication**
   - [ ] Check package on npm: `https://www.npmjs.com/package/namecheap-cli`
   - [ ] Install from npm: `npm install -g namecheap-cli`
   - [ ] Test installation works: `namecheap --version`

## Post-Publication

### GitHub Release

- [ ] Create GitHub release from tag v0.1.0
- [ ] Copy release notes from CHANGELOG.md
- [ ] Mark as latest release
- [ ] Publish release

### Documentation Updates

- [ ] Update README badges (npm version, downloads)
- [ ] Create/update project documentation site (optional)
- [ ] Update personal website/portfolio (optional)

### Community & Marketing

- [ ] Announce on Twitter/X
- [ ] Post on relevant Reddit communities:
  - r/node
  - r/webdev
  - r/javascript
  - r/programming (if allowed)
- [ ] Share on Hacker News (Show HN)
- [ ] Add to awesome lists:
  - awesome-cli-apps
  - awesome-nodejs
  - awesome-typescript
- [ ] Write blog post/tutorial (optional)
- [ ] Create demo video (optional)

### Monitoring

- [ ] Monitor npm downloads: `https://npm-stat.com/charts.html?package=namecheap-cli`
- [ ] Watch for issues on GitHub
- [ ] Check npm package page for user comments
- [ ] Monitor social media mentions

## Rollback Procedure (If Needed)

If critical issues are found after publishing:

1. **Unpublish within 72 hours** (if absolutely necessary)
   ```bash
   npm unpublish namecheap-cli@0.1.0
   ```
   Note: Unpublishing is discouraged by npm

2. **Publish patch version** (recommended approach)
   - Fix the issue
   - Bump to v0.1.1
   - Publish new version
   - Deprecate old version: `npm deprecate namecheap-cli@0.1.0 "Critical bug, use 0.1.1"`

## Version Bump Checklist (For Next Release)

- [ ] Update version in `package.json`
- [ ] Add new section to `CHANGELOG.md`
- [ ] Update date in CHANGELOG
- [ ] Commit version bump
- [ ] Tag new version
- [ ] Repeat publication steps

## Semantic Versioning Guide

- **PATCH** (0.1.1) - Bug fixes, no breaking changes
- **MINOR** (0.2.0) - New features, backward compatible
- **MAJOR** (1.0.0) - Breaking changes

## Support Checklist

After publication, be prepared to:

- [ ] Respond to GitHub issues within 48 hours
- [ ] Answer questions in Discussions
- [ ] Review and merge community PRs
- [ ] Update dependencies regularly
- [ ] Monitor security advisories

## Notes

- First publication to npm is permanent (package name reserved)
- Version numbers cannot be reused (even if unpublished)
- Package names are first-come, first-served
- Consider package scope for organization: `@yourorg/namecheap-cli`

---

**Last Updated**: 2025-01-21
**Current Version**: 0.1.0
**Status**: Ready for initial publication