import { defineConfig } from 'vitepress'
import ohmMarkdownPlugin from '../plugins/ohm-plugin/vitepress-ohm-plugin'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Obsidian SQLSeal",
  description: "Plugin enabling full SQL capabilities in Obsidian",
  base: '/sql-seal/',
  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/sql-seal/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/sql-seal/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/sql-seal/apple-touch-icon.png' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quick-start' }
    ],
    search: {
      provider: 'local'
    },
    logo: '/logo.svg',

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'Demo Vault', link: '/demo-vault' },
          { text: 'Changing Render Methods', link: '/changing-render-method'},
          { text: 'Using properties', link: '/using-properties' },
          { text: 'Comments', link: '/comments' },
          { text: 'Query Vault Content', link: '/query-vault-content' },
          { text: 'Query Markdown Tables', link: '/query-markdown-tables'},
          { text: 'Inline codeblocks', link: '/inline-codeblocks' },
          { text: 'Links and Images', link: '/links-and-images' },
          { text: 'CSV Viewer', link: '/csv-viewer' },
          { text: 'Query Configuration', link: '/query-configuration' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Future Plans', link: '/future-plans' },
          { text: 'Changelog', link: '/changelog' }
        ]
      },
      {
        text: 'Data Sources',
        items: [
          { text: 'Vault Data', link: '/data-sources/vault-data' },
          { text: 'CSV', link: '/data-sources/csv' },
          { text: 'JSON and JSON5', link: '/data-sources/json-and-json5' },
          { text: 'Markdown Tables', link: '/data-sources/markdown-tables' },
        ]
      },
      {
        text: 'Renderers',
        items: [
          { text: 'Grid', link: '/renderers/grid' },
          { text: 'HTML', link: '/renderers/html' },
          { text: 'Template', link: '/renderers/template' },
          { text: 'List', link: '/renderers/list' },
          { text: 'Markdown', link: '/renderers/markdown' },
        ]
      },
      {
        text: 'FAQ',
        items: [
          { text: 'Comparison with Dataview', link: '/faq/comparison-with-dataview' }
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Contributing', link: '/contributing/get-started' },
          { text: 'Reporting a bug', link: '/contributing/reporting-bugs' },
          { text: 'Project Architecture', link: '/contributing/project-architecture' },
          { text: 'Project Setup', link: '/contributing/project-setup' },
          { text: 'Troubleshooting', link: '/contributing/troubleshooting' }



        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/h-sphere/sql-seal' },
      { icon: 'discord', link: 'https://discord.gg/ZMRnFeAWXb' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/hypersphereblog.bsky.social' }
    ],
    footer: {
      message: '',
      copyright: 'By <a href="https://hypersphere.blog">hypersphere</a>.<br/>Sponsor Me: <a href="https://ko-fi.com/hypersphere">Ko-Fi</a>'
    }
  },
  markdown: {
    config(md) {
      md.use(ohmMarkdownPlugin())
    },
  }
})
