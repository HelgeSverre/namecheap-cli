<script setup>
import { ref } from 'vue'

const copied = ref(false)
const activeTab = ref('npm')

const tabs = [
  { id: 'npm', label: 'npm', command: 'npm install -g namecheap-cli' },
  { id: 'pnpm', label: 'pnpm', command: 'pnpm add -g namecheap-cli' },
  { id: 'yarn', label: 'yarn', command: 'yarn global add namecheap-cli' },
  { id: 'bun', label: 'bun', command: 'bun add -g namecheap-cli' },
]

function copyInstall() {
  navigator.clipboard.writeText('npm install -g namecheap-cli')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function copyTabCommand() {
  const tab = tabs.find((t) => t.id === activeTab.value)
  if (tab) {
    navigator.clipboard.writeText(tab.command)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const features = [
  {
    icon: '🌐',
    title: 'Domain Management',
    description: 'List, register, renew, lock and unlock domains.',
  },
  {
    icon: '📋',
    title: 'DNS Records',
    description: 'Add, update, and delete DNS records and email forwarding.',
  },
  {
    icon: '🛡️',
    title: 'WhoisGuard Privacy',
    description: 'Enable and disable WHOIS privacy protection.',
  },
  {
    icon: '⌨️',
    title: 'Shell Completions',
    description: 'Tab completion for bash, zsh, and fish.',
  },
  {
    icon: '📦',
    title: 'JSON Output',
    description: 'Machine-readable output for scripting and automation.',
  },
  {
    icon: '🧪',
    title: 'Sandbox Mode',
    description: 'Test safely with the Namecheap sandbox API.',
  },
]
</script>

<template>
  <!-- Section 1: Hero -->
  <section class="hero-section">
    <div class="hero-container">
      <h1 class="hero-heading">
        Manage Namecheap from your <span class="hero-gradient">terminal</span>
      </h1>
      <p class="hero-subheading">
        A powerful CLI for managing domains, DNS records, nameservers, and WhoisGuard privacy. Built
        with TypeScript.
      </p>
      <div class="hero-install" @click="copyInstall">
        <code>npm install -g namecheap-cli</code>
        <span class="copy-icon">{{ copied ? '✓' : '📋' }}</span>
      </div>
      <div class="hero-actions">
        <a href="/guide/getting-started" class="btn btn-primary">Get Started</a>
        <a
          href="https://github.com/HelgeSverre/namecheap-cli"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary"
          >GitHub</a
        >
      </div>
    </div>
  </section>

  <!-- Section 2: Terminal Demo -->
  <section class="terminal-section">
    <div class="section-container">
      <div class="terminal-window">
        <div class="terminal-header">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
        </div>
        <div class="terminal-body">
          <pre><span class="terminal-prompt">$</span> <span class="terminal-cmd">namecheap domains list</span>

<span class="terminal-table">┌──────────────────┬────────────┬────────┬───────────┐
│ Domain           │ Expires    │ Locked │ AutoRenew │
├──────────────────┼────────────┼────────┼───────────┤
│ example.com      │ 2026-11-15 │ Yes    │ Yes       │
│ mysite.io        │ 2027-03-22 │ Yes    │ No        │
│ startup.dev      │ 2026-08-01 │ No     │ Yes       │
└──────────────────┴────────────┴────────┴───────────┘</span>

<span class="terminal-prompt">$</span> <span class="terminal-cmd">namecheap dns list example.com</span>

<span class="terminal-table">┌───────┬──────────┬───────────────────────────────┬─────┐
│ Type  │ Host     │ Value                         │ TTL │
├───────┼──────────┼───────────────────────────────┼─────┤
│ A     │ @        │ 76.76.21.21                   │ 300 │
│ CNAME │ www      │ cname.vercel-dns.com          │ 300 │
│ MX    │ @        │ mx1.privateemail.com          │ 300 │
│ TXT   │ @        │ v=spf1 include:spf.efwd.r...  │ 300 │
└───────┴──────────┴───────────────────────────────┴─────┘</span></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Feature Grid -->
  <section class="features-section">
    <div class="section-container">
      <h2 class="section-heading">Everything you need</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: Quick Install -->
  <section class="install-section">
    <div class="section-container">
      <h2 class="section-heading">Quick Install</h2>
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
      <div class="install-command" @click="copyTabCommand">
        <code>{{ tabs.find((t) => t.id === activeTab)?.command }}</code>
        <span class="copy-icon">{{ copied ? '✓' : '📋' }}</span>
      </div>
      <p class="install-alt">
        Or run without installing: <code>npx namecheap-cli domains list</code>
      </p>
    </div>
  </section>

  <!-- Section 5: Footer CTA -->
  <section class="cta-section">
    <div class="section-container">
      <h2 class="cta-heading">Ready to get started?</h2>
      <p class="cta-subheading">Install namecheap-cli and manage your domains in seconds.</p>
      <div class="cta-actions">
        <a href="/guide/getting-started" class="btn btn-primary">Read the Docs</a>
        <a
          href="https://www.npmjs.com/package/namecheap-cli"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary"
          >View on npm</a
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Base */
.section-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-heading {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2.5rem;
  color: var(--vp-c-text-1);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 100px 24px 80px;
  text-align: center;
}

:root:not(.dark) .hero-section {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.hero-container {
  max-width: 800px;
  margin: 0 auto;
}

.hero-heading {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

.hero-gradient {
  background: linear-gradient(135deg, #fe5803, #ff8c44);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subheading {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-install {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.hero-install:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.hero-install code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.95rem;
  color: #ffffff;
}

.copy-icon {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.hero-install:hover .copy-icon,
.install-command:hover .copy-icon {
  opacity: 1;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: #fe5803;
  color: #ffffff;
}

.btn-primary:hover {
  background: #ff6d24;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Terminal Section */
.terminal-section {
  padding: 80px 24px;
  background: var(--vp-c-bg);
}

.terminal-window {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.terminal-header {
  background: #2d2d2d;
  padding: 12px 16px;
  display: flex;
  gap: 8px;
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red {
  background: #ff5f56;
}

.dot-yellow {
  background: #ffbd2e;
}

.dot-green {
  background: #27c93f;
}

.terminal-body {
  background: #1a1a1a;
  padding: 20px 24px;
  overflow-x: auto;
}

.terminal-body pre {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
  white-space: pre;
}

.terminal-prompt {
  color: #27c93f;
  font-weight: 600;
}

.terminal-cmd {
  color: #ffffff;
  font-weight: 500;
}

.terminal-table {
  color: #b0b0b0;
}

/* Features Section */
.features-section {
  padding: 80px 24px;
  background: var(--vp-c-bg-soft);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 28px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.feature-card:hover {
  border-color: #fe5803;
  box-shadow: 0 4px 20px rgba(254, 88, 3, 0.1);
}

.feature-icon {
  font-size: 1.75rem;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.feature-description {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

/* Install Section */
.install-section {
  padding: 80px 24px;
  background: var(--vp-c-bg);
}

.install-tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.tab-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.tab-btn.active {
  background: #fe5803;
  color: #ffffff;
  border-color: #fe5803;
}

.install-command {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 24px;
  max-width: 500px;
  margin: 0 auto 1.5rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.install-command:hover {
  border-color: var(--vp-c-brand-1);
}

.install-command code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.install-alt {
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.install-alt code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  background: var(--vp-c-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--vp-c-text-1);
}

/* CTA Section */
.cta-section {
  padding: 80px 24px;
  background: linear-gradient(180deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%);
  text-align: center;
}

.cta-heading {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.cta-subheading {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.cta-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive: Tablet */
@media (max-width: 960px) {
  .hero-heading {
    font-size: 2.5rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive: Mobile */
@media (max-width: 768px) {
  .hero-section {
    padding: 80px 20px 60px;
  }

  .hero-heading {
    font-size: 2rem;
  }

  .hero-subheading {
    font-size: 1.1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .terminal-body pre {
    font-size: 0.75rem;
  }

  .section-heading {
    font-size: 1.6rem;
  }

  .cta-heading {
    font-size: 1.6rem;
  }
}
</style>
