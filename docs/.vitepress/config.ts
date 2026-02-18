import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Meridian',
  description: 'AI Agent Framework for DeFi — every chain, every protocol, one agent framework.',
  head: [
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Meridian — AI Agent Framework for DeFi' }],
    ['meta', { name: 'og:description', content: 'Build autonomous DeFi agents that sense, think, and act across any chain.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo.svg', alt: 'Meridian' },
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference/sdk' },
      { text: 'Examples', link: '/examples' },
      { text: 'Dashboard', link: 'https://app.meridianagents.xyz', target: '_blank' },
      { text: 'GitHub', link: 'https://github.com/amitduabits/meridiandefi', target: '_blank' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Examples', link: '/examples' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Strategy DSL', link: '/strategy-dsl' },
          { text: 'Protocol Adapters', link: '/protocol-adapters' },
          { text: 'Risk Management', link: '/risk-management' },
          { text: 'Agent Communication', link: '/agent-communication' },
          { text: 'Smart Contracts', link: '/smart-contracts' },
          { text: 'SDK API', link: '/api-reference/sdk' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/amitduabits/meridiandefi' },
      { icon: 'twitter', link: 'https://twitter.com/MeridianAgents' },
    ],
    search: { provider: 'local' },
    footer: {
      message: 'Open source under MIT License',
      copyright: 'Built by infrastructure engineers. Zero VC.'
    },
    editLink: {
      pattern: 'https://github.com/amitduabits/meridiandefi/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },
  cleanUrls: true,
  srcExclude: ['**/blog/**', '**/grants/**', '**/research/**', '**/social/**'],
})
