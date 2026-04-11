import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MicroMonkey",
  description: "Edit files on your MicroPython microcontroller with just a web browser!",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'IDE', link: '/ide' },
      { text: 'Quick start', link: '/docs/quickstart' }
    ],
    logo: "/logo.svg",
    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Quick start', link: '/docs/quickstart' },
          { text: 'Flashing MicroPython', link: '/docs/flash-micropython' },
          { text: 'Troubleshooting', link: '/docs/troubleshooting' }
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
  cleanUrls: true
})
