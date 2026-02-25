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
