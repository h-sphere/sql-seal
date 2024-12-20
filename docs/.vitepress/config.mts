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
          { text: 'Changing Render Methods', link: '/changing-render-method'},
          { text: 'Using properties', link: '/using-properties' },
          { text: 'Query Vault Content', link: '/query-vault-content' },
          { text: 'Links and Images', link: '/links-and-images' },
          { text: 'CSV Viewer', link: '/csv-viewer'},
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Future Plans', link: '/future-plans' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    footer: {
      message: '',
      copyright: 'By <a href="https://hypersphere.blog">hypersphere</a>. Ko-Fi: <a href="https://ko-fi.com/hypersphere">hypersphere</a>'
    }
  }
})
