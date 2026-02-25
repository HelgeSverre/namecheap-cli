# VitePress Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a VitePress documentation site with a custom Vue homepage for the namecheap-cli project.

**Architecture:** VitePress site in `website/` directory extending the default theme with a custom homepage Vue component. Docs content extracted from README.md into structured guide and command reference pages.

**Tech Stack:** VitePress, Vue 3, pnpm, scoped CSS with VitePress CSS variables

---

### Task 1: Scaffold VitePress project

**Files:**
- Create: `website/package.json`
- Create: `website/.vitepress/config.ts`
- Create: `website/index.md`

**Step 1: Create website directory and package.json**

```bash
mkdir -p website
```

Create `website/package.json`:
```json
{
  "name": "namecheap-cli-docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  }
}
```

**Step 2: Install dependencies**

```bash
cd website && pnpm add -D vitepress vue
```

**Step 3: Create VitePress config**

Create `website/.vitepress/config.ts`:
```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Namecheap CLI',
  description: 'Manage Namecheap domains, DNS records, and more from your terminal',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Commands', link: '/commands/domains' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Shell Completions', link: '/guide/shell-completions' },
          ],
        },
      ],
      '/commands/': [
        {
          text: 'Commands',
          items: [
            { text: 'Domains', link: '/commands/domains' },
            { text: 'DNS', link: '/commands/dns' },
            { text: 'Nameservers', link: '/commands/ns' },
            { text: 'Auth', link: '/commands/auth' },
            { text: 'Users', link: '/commands/users' },
            { text: 'WhoisGuard', link: '/commands/whoisguard' },
            { text: 'Config', link: '/commands/config' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/HelgeSverre/namecheap-cli' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/namecheap-cli' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Helge Sverre',
    },
    search: {
      provider: 'local',
    },
  },
})
```

**Step 4: Create placeholder index.md**

Create `website/index.md`:
```md
---
layout: home
hero:
  name: Namecheap CLI
  text: Manage domains from your terminal
  tagline: Placeholder — custom homepage coming in next task
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
---
```

**Step 5: Verify dev server starts**

```bash
cd website && pnpm dev
```
Expected: VitePress dev server running at http://localhost:5173 with placeholder homepage.

**Step 6: Commit**

```bash
git add website/package.json website/pnpm-lock.yaml website/.vitepress/config.ts website/index.md
git commit -m "feat(website): scaffold VitePress project"
```

---

### Task 2: Custom theme setup and global styles

**Files:**
- Create: `website/.vitepress/theme/index.ts`
- Create: `website/.vitepress/theme/style.css`

**Step 1: Create theme entry**

Create `website/.vitepress/theme/index.ts`:
```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
} satisfies Theme
```

**Step 2: Create custom styles with Namecheap branding**

Create `website/.vitepress/theme/style.css`:
```css
:root {
  --vp-c-brand-1: #FE5803;
  --vp-c-brand-2: #FF6D24;
  --vp-c-brand-3: #FF8C44;
  --vp-c-brand-soft: rgba(254, 88, 3, 0.14);
}

.dark {
  --vp-c-brand-1: #FF8C44;
  --vp-c-brand-2: #FE5803;
  --vp-c-brand-3: #FF6D24;
  --vp-c-brand-soft: rgba(254, 88, 3, 0.16);
}

:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #FE5803, #FF8C44);
}
```

**Step 3: Verify branding applied**

```bash
cd website && pnpm dev
```
Expected: Orange branding visible on the placeholder homepage hero.

**Step 4: Commit**

```bash
git add website/.vitepress/theme/
git commit -m "feat(website): add custom theme with Namecheap branding"
```

---

### Task 3: Custom HomePage.vue component

**Files:**
- Create: `website/.vitepress/theme/HomePage.vue`
- Modify: `website/.vitepress/theme/index.ts` — register component
- Modify: `website/index.md` — switch to custom layout

**Step 1: Create the HomePage component**

Create `website/.vitepress/theme/HomePage.vue` — a single-file Vue component with five sections:

1. **Hero** — dark background, large heading, install command with copy button, CTA buttons
2. **Terminal demo** — styled terminal window showing `namecheap domains list` and `namecheap dns list` output
3. **Feature grid** — 6 cards (3x2)
4. **Quick install** — tabbed package manager commands
5. **Footer CTA** — final call to action

The component uses scoped CSS only, no external dependencies. All colors reference VitePress CSS variables plus the `#FE5803` / `#FF8C44` brand colors.

```vue
<script setup>
import { ref } from 'vue'

const copied = ref(false)
const activeTab = ref('npm')

const tabs = [
  { id: 'npm', label: 'npm', cmd: 'npm install -g namecheap-cli' },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add -g namecheap-cli' },
  { id: 'yarn', label: 'yarn', cmd: 'yarn global add namecheap-cli' },
  { id: 'bun', label: 'bun', cmd: 'bun install -g namecheap-cli' },
]

const features = [
  { title: 'Domain Management', desc: 'List, register, renew, lock and unlock domains.', icon: '🌐' },
  { title: 'DNS Records', desc: 'Add, update, and delete DNS records and email forwarding.', icon: '📋' },
  { title: 'WhoisGuard Privacy', desc: 'Enable and disable WHOIS privacy protection.', icon: '🛡️' },
  { title: 'Shell Completions', desc: 'Tab completion for bash, zsh, and fish.', icon: '⌨️' },
  { title: 'JSON Output', desc: 'Machine-readable output for scripting and automation.', icon: '📦' },
  { title: 'Sandbox Mode', desc: 'Test safely with the Namecheap sandbox API.', icon: '🧪' },
]

function copyInstall() {
  navigator.clipboard.writeText('npm install -g namecheap-cli')
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function copyTab() {
  const cmd = tabs.find(t => t.id === activeTab.value)?.cmd
  if (cmd) navigator.clipboard.writeText(cmd)
}
</script>

<template>
  <!-- Hero -->
  <section class="hero">
    <div class="hero-inner">
      <h1 class="hero-title">Manage Namecheap<br>from your terminal</h1>
      <p class="hero-tagline">
        A powerful CLI for managing domains, DNS records, nameservers,
        and WhoisGuard privacy. Built with TypeScript.
      </p>
      <div class="hero-install" @click="copyInstall">
        <code>$ npm install -g namecheap-cli</code>
        <span class="copy-hint">{{ copied ? 'Copied!' : 'Click to copy' }}</span>
      </div>
      <div class="hero-actions">
        <a href="/guide/getting-started" class="btn btn-brand">Get Started</a>
        <a href="https://github.com/HelgeSverre/namecheap-cli" target="_blank" class="btn btn-outline">GitHub</a>
      </div>
    </div>
  </section>

  <!-- Terminal Demo -->
  <section class="terminal-section">
    <div class="container">
      <div class="terminal">
        <div class="terminal-header">
          <span class="terminal-dot red"></span>
          <span class="terminal-dot yellow"></span>
          <span class="terminal-dot green"></span>
          <span class="terminal-title">Terminal</span>
        </div>
        <div class="terminal-body">
          <pre><span class="t-prompt">$</span> <span class="t-cmd">namecheap domains list</span>

<span class="t-table">┌──────────────────────┬────────────┬──────────┬─────────────┐
│ Domain               │ Expires    │ Locked   │ AutoRenew   │
├──────────────────────┼────────────┼──────────┼─────────────┤
│ example.com          │ 2027-03-15 │ Yes      │ Yes         │
│ mysite.io            │ 2026-11-01 │ Yes      │ No          │
│ coolproject.dev      │ 2026-08-22 │ No       │ Yes         │
└──────────────────────┴────────────┴──────────┴─────────────┘</span>

<span class="t-prompt">$</span> <span class="t-cmd">namecheap dns list example.com</span>

<span class="t-table">┌──────┬──────────────────┬───────┬───────────────────────┬─────┐
│ Type │ Host             │ TTL   │ Value                 │ MX  │
├──────┼──────────────────┼───────┼───────────────────────┼─────┤
│ A    │ @                │ 1800  │ 76.76.21.21           │     │
│ CNAME│ www              │ 1800  │ example.com           │     │
│ MX   │ @                │ 1800  │ mail.example.com      │ 10  │
│ TXT  │ @                │ 1800  │ v=spf1 include:...    │     │
└──────┴──────────────────┴───────┴───────────────────────┴─────┘</span></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features-section">
    <div class="container">
      <h2 class="section-title">Everything you need</h2>
      <div class="features-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <span class="feature-icon">{{ f.icon }}</span>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Install Tabs -->
  <section class="install-section">
    <div class="container">
      <h2 class="section-title">Quick Install</h2>
      <div class="install-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="install-cmd" @click="copyTab">
        <code>$ {{ tabs.find(t => t.id === activeTab)?.cmd }}</code>
      </div>
      <p class="install-alt">
        Or run without installing: <code>npx namecheap-cli domains list</code>
      </p>
    </div>
  </section>

  <!-- Footer CTA -->
  <section class="cta-section">
    <div class="container">
      <h2>Ready to get started?</h2>
      <p>Install namecheap-cli and manage your domains in seconds.</p>
      <div class="hero-actions">
        <a href="/guide/getting-started" class="btn btn-brand">Read the Docs</a>
        <a href="https://www.npmjs.com/package/namecheap-cli" target="_blank" class="btn btn-outline">View on npm</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 80px 24px 60px;
  text-align: center;
  background: linear-gradient(180deg, var(--vp-c-bg) 0%, var(--vp-c-bg-soft) 100%);
}
.hero-inner {
  max-width: 700px;
  margin: 0 auto;
}
.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  background: linear-gradient(135deg, #FE5803, #FF8C44);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}
.hero-tagline {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
  line-height: 1.6;
}
.hero-install {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  margin-bottom: 32px;
  transition: border-color 0.2s;
}
.hero-install:hover {
  border-color: #FE5803;
}
.hero-install code {
  font-size: 1rem;
  color: var(--vp-c-text-1);
}
.copy-hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}
.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-brand {
  background: #FE5803;
  color: #fff;
}
.btn-brand:hover {
  background: #e54e00;
}
.btn-outline {
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: transparent;
}
.btn-outline:hover {
  border-color: #FE5803;
  color: #FE5803;
}

/* Container */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Terminal */
.terminal-section {
  padding: 60px 24px;
}
.terminal {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--vp-c-divider);
}
.terminal-header {
  background: #2d2d2d;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.terminal-dot.red { background: #ff5f57; }
.terminal-dot.yellow { background: #febc2e; }
.terminal-dot.green { background: #28c840; }
.terminal-title {
  margin-left: 8px;
  color: #999;
  font-size: 0.85rem;
}
.terminal-body {
  background: #1a1a1a;
  padding: 20px;
  overflow-x: auto;
}
.terminal-body pre {
  margin: 0;
  color: #e0e0e0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}
.t-prompt { color: #28c840; font-weight: bold; }
.t-cmd { color: #fff; }
.t-table { color: #a0a0a0; }

/* Features */
.features-section {
  padding: 60px 24px;
}
.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 40px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 2rem;
  }
}
@media (max-width: 960px) and (min-width: 769px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.feature-card {
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
}
.feature-card:hover {
  border-color: #FE5803;
}
.feature-icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 12px;
}
.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.feature-card p {
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Install */
.install-section {
  padding: 60px 24px;
  text-align: center;
}
.install-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 16px;
}
.tab-btn {
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 6px;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #FE5803;
  color: #fff;
  border-color: #FE5803;
}
.install-cmd {
  display: inline-block;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 24px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: border-color 0.2s;
}
.install-cmd:hover {
  border-color: #FE5803;
}
.install-cmd code {
  font-size: 1rem;
  color: var(--vp-c-text-1);
}
.install-alt {
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}
.install-alt code {
  background: var(--vp-c-bg-alt);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* CTA */
.cta-section {
  padding: 80px 24px;
  text-align: center;
  background: var(--vp-c-bg-soft);
}
.cta-section h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.cta-section p {
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  margin-bottom: 24px;
}
</style>
```

**Step 2: Register component in theme**

Modify `website/.vitepress/theme/index.ts`:
```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomePage from './HomePage.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  },
} satisfies Theme
```

**Step 3: Update index.md to use custom component**

Replace `website/index.md`:
```md
---
layout: page
---

<HomePage />
```

**Step 4: Verify homepage renders**

```bash
cd website && pnpm dev
```
Expected: Custom homepage visible at http://localhost:5173 with hero, terminal demo, features grid, install tabs, and footer CTA.

**Step 5: Commit**

```bash
git add website/.vitepress/theme/ website/index.md
git commit -m "feat(website): add custom homepage with hero, terminal demo, and features"
```

---

### Task 4: Guide docs — Getting Started, Configuration, Shell Completions

**Files:**
- Create: `website/guide/getting-started.md`
- Create: `website/guide/configuration.md`
- Create: `website/guide/shell-completions.md`

**Step 1: Create getting-started.md**

Content sourced from README Quick Start + Installation sections. Include:
- Prerequisites (Node 18+)
- Install methods (npm/pnpm/yarn/bun)
- API credentials setup (step-by-step with Namecheap account links)
- Authentication (`namecheap auth login`)
- First commands (list domains, check availability, view DNS)

**Step 2: Create configuration.md**

Content sourced from README Config + Sandbox sections. Include:
- Config commands (`config list/get/set/path`)
- Available options (sandbox, output)
- Output formats (table vs JSON, `--json` flag)
- Sandbox mode setup

**Step 3: Create shell-completions.md**

Content sourced from README Shell Completions section. Include:
- Auto-install (`completions install`)
- Per-shell install (bash/zsh/fish)
- Homebrew integration
- Manual setup alternatives
- Uninstall

**Step 4: Verify navigation and pages**

```bash
cd website && pnpm dev
```
Expected: All three guide pages render. Sidebar navigation works.

**Step 5: Commit**

```bash
git add website/guide/
git commit -m "feat(website): add guide docs — getting started, configuration, shell completions"
```

---

### Task 5: Command reference docs

**Files:**
- Create: `website/commands/auth.md`
- Create: `website/commands/domains.md`
- Create: `website/commands/dns.md`
- Create: `website/commands/ns.md`
- Create: `website/commands/users.md`
- Create: `website/commands/whoisguard.md`
- Create: `website/commands/config.md`

**Step 1: Create all seven command reference pages**

For each command group, create a page with:
- Overview description
- Each subcommand: synopsis, description, options/flags, example usage with expected output

Source content from the README Commands section. Expand with details from `src/commands/<group>/` source files where the README is sparse.

Reference files for each command group:
- Auth: `src/commands/auth/` — login, logout, status
- Domains: `src/commands/domains/` — list, info, check, lock, unlock, register, renew, contacts
- DNS: `src/commands/dns/` — list, add, set, rm, email (list/add/rm)
- Nameservers: `src/commands/ns/` — list, set, reset, create, delete, info, update
- Users: `src/commands/users/` — balances, pricing
- WhoisGuard: `src/commands/whoisguard/` — list, enable, disable, allot, unallot, renew
- Config: `src/commands/config/` — list, get, set, path

**Step 2: Verify all pages render with sidebar**

```bash
cd website && pnpm dev
```
Expected: All seven command pages render. Sidebar links all work.

**Step 3: Commit**

```bash
git add website/commands/
git commit -m "feat(website): add command reference docs for all command groups"
```

---

### Task 6: Add .gitignore and verify build

**Files:**
- Create: `website/.gitignore`

**Step 1: Create .gitignore**

Create `website/.gitignore`:
```
node_modules
.vitepress/cache
.vitepress/dist
```

**Step 2: Verify production build**

```bash
cd website && pnpm build
```
Expected: Build succeeds, output in `website/.vitepress/dist/`.

**Step 3: Preview production build**

```bash
cd website && pnpm preview
```
Expected: Production site serves correctly at http://localhost:4173.

**Step 4: Commit**

```bash
git add website/.gitignore
git commit -m "feat(website): add gitignore, verify production build"
```

---

### Task 7: Final polish and review

**Step 1: Verify all pages**
- Homepage renders all 5 sections
- All guide pages load and have content
- All command reference pages load and have content
- Light/dark mode toggle works
- Mobile responsive layout works
- Local search works

**Step 2: Fix any issues found**

**Step 3: Final commit if needed**

```bash
git add -A website/
git commit -m "feat(website): polish and finalize"
```
