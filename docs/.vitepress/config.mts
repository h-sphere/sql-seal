import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Obsidian SQLSeal",
  description: "Plugin enabling full SQL capabilities in Obsidian",
  base: '/sql-seal/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quick-start' }
    ],

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'Demo Vault', link: '/demo-vault' },
          { text: 'Changing Render Methods', link: '/changing-render-method'},
          { text: 'Using properties', link: '/using-properties' },
          { text: 'Query Vault Content', link: '/query-vault-content' },
          { text: 'Query Markdown Tables', link: '/query-markdown-tables'},
          { text: 'Inline codeblocks', link: '/inline-codeblocks' },
          { text: 'Links and Images', link: '/links-and-images' },
          { text: 'CSV Viewer', link: '/csv-viewer' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Future Plans', link: '/future-plans' },
          { text: 'Changelog', link: '/changelog' }
        ]
      },
      {
        text: 'Renderers',
        items: [
          { text: 'Grid', link: '/renderers/grid' },
          { text: 'HTML', link: '/renderers/html' },
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
      copyright: 'By <a href="https://hypersphere.blog">hypersphere</a>. Ko-Fi: <a href="https://ko-fi.com/hypersphere">hypersphere</a>'
    }
  }
})
