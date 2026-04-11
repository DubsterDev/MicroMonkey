import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MicroMonkey",
  description: "Edit files on your MicroPython microcontroller with just a web browser!",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'IDE', link: '/ide/', target: '_self' },
      { text: 'Documentation', link: '/docs/quickstart' }
    ],
    logo: "/logo.svg",
    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Quick start', link: '/docs/quickstart' },
          { text: 'File Management', link: '/docs/file-management' },
          { text: 'Using Intellisense', link: '/docs/intellisense' },
          { text: 'Using the Serial Monitor', link: '/docs/serial-monitor' },
          { text: 'Flashing MicroPython', link: '/docs/flash-micropython' },
          { text: 'Troubleshooting', link: '/docs/troubleshooting' },
        ]
      },
      {
        text: 'More',
        items: [
          { text: 'Changelog', link: '/changelog' },
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' }
        ]
      }
    ],
    notFound: {
      quote: "Sorry, this page could not be found."
    },
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/FXZFun/micromonkey' }
    // ]
  },
  cleanUrls: true,
  ignoreDeadLinks: true
})
