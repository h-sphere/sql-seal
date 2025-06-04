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
        collapsed: true,
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
          { text: 'Define Column Types', link: '/define-column-types' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Future Plans', link: '/future-plans' },
          { text: 'Changelog', link: '/changelog' }
        ]
      },
      {
        text: 'Data Sources',
        collapsed: true,
        items: [
          { text: 'Vault Data', link: '/data-sources/vault-data' },
          { text: 'CSV', link: '/data-sources/csv' },
          { text: 'JSON and JSON5', link: '/data-sources/json-and-json5' },
          { text: 'Markdown Tables', link: '/data-sources/markdown-tables' },
        ]
      },
      {
        text: 'Renderers',
        collapsed: true,
        items: [
          { text: 'Grid', link: '/renderers/grid' },
          { text: 'HTML', link: '/renderers/html' },
          { text: 'Template', link: '/renderers/template' },
          { text: 'List', link: '/renderers/list' },
          { text: 'Markdown', link: '/renderers/markdown' },
        ]
      },
      {
        text: 'Charts',
        collapsed: true,
        items: [
          { text: 'Charts introduction', link: '/charts/introduction' },
          { text: 'Basics', link: '/charts/basics' },
          { text: 'Chart Types', items: [
            { text: 'Bar Chart', link: '/charts/types/bar-chart', docFooterText: 'Chart Types: Bar Chart' },
            { text: 'Line Chart', link: '/charts/types/line-chart', docFooterText: 'Chart Types: Line Chart' },
            { text: 'Pie Chart', link: '/charts/types/pie-chart', docFooterText: 'Chart Types: Pie Chart' },
            { text: 'Scatter Plot', link: '/charts/types/scatter-plot', docFooterText: 'Chart Types: Scatter Plot' },
            { text: 'Candlestick', link: '/charts/types/candlestick', docFooterText: 'Chart Types: Candlestick' },
            { text: 'Radar', link: '/charts/types/radar', docFooterText: 'Chart Types: Radar' },
            { text: 'Sunburst', link: '/charts/types/sunburst', docFooterText: 'Chart Types: Sunburst' },
            { text: 'Mixed Charts', link: '/charts/types/mixed-charts' }

          ]},
          { text: 'Advanced Mode', link: '/charts/advanced-mode' },
          { text: 'Regression', link: '/charts/regression' },
          { text: 'Clustering', link: '/charts/clustering' }
        ]
      },
      {
        text: 'FAQ',
        collapsed: true,
        items: [
          { text: 'Comparison with Dataview', link: '/faq/comparison-with-dataview' },
          { text: 'SQLSeal with Obsidian Sync', link: '/faq/obsidian-sync' },
		  { text: 'Understanding Tags', link: '/faq/understanding-tags'}

        ]
      },
      {
        collapsed: true,
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
      { icon: 'bluesky', link: 'https://bsky.app/profile/hypersphereblog.bsky.social' },
      { icon: 'kofi', link: 'https://ko-fi.com/hypersphere' },
      { icon: 'patreon', link: 'https://www.patreon.com/c/hypersphere' },

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
