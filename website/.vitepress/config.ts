import { defineConfig } from 'vitepress'

const siteUrl = 'https://namecheap-cli.vercel.app'
const title = 'Namecheap CLI'
const description =
  'A powerful command-line interface for managing Namecheap domains, DNS records, nameservers, and WhoisGuard privacy. Built with TypeScript.'

export default defineConfig({
  title,
  description,
  head: [
    // Favicon
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],

    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:site_name', content: title }],

    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],

    // Additional meta
    ['meta', { name: 'theme-color', content: '#FE5803' }],
    ['meta', { name: 'author', content: 'Helge Sverre' }],
    ['meta', { name: 'keywords', content: 'namecheap, cli, dns, domain, nameserver, whoisguard, command-line, terminal' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Commands', link: '/commands/domains' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Shell Completions', link: '/guide/shell-completions' },
        ],
      },
      {
        text: 'Commands',
        items: [
          { text: 'Auth', link: '/commands/auth' },
          { text: 'Domains', link: '/commands/domains' },
          { text: 'DNS', link: '/commands/dns' },
          { text: 'Nameservers', link: '/commands/ns' },
          { text: 'Users', link: '/commands/users' },
          { text: 'WhoisGuard', link: '/commands/whoisguard' },
          { text: 'Address', link: '/commands/address' },
          { text: 'Config', link: '/commands/config' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/HelgeSverre/namecheap-cli' },
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
