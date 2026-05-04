import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MicroMonkey",
  description: "A fast, browser-based MicroPython IDE for ESP32 with built-in REPL, syntax checking, and flasher, no installation required!",
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
          { text: 'About the Command Palette', link: '/docs/command-palette' },
          { text: 'Flashing MicroPython', link: '/docs/flash-micropython' },
          { text: 'Troubleshooting', link: '/docs/troubleshooting' },
        ]
      },
      {
        text: 'More',
        items: [
          { text: 'Changelog', link: '/more/changelog' },
          { text: 'Third-party Software Licenses', link: '/more/licenses' },
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
