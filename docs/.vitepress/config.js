import { defineConfig } from 'vitepress'

const isNightly = process.env.VITE_IS_NIGHTLY === 'true'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  transformPageData(pageData) {
    if (pageData.frontmatter.layout === 'home' && isNightly) {
      pageData.frontmatter.hero.name = pageData.frontmatter.hero.name +' Nightly'
      pageData.frontmatter.hero.tagline = "This is the nightly build of MicroMonkey, built from the latest commit on the GitHub repository."
    }
  },
  title: isNightly ? "MicroMonkey Nightly" : "MicroMonkey",
  description: (isNightly ? "Nightly build of MicroMonkey, a" : "A") + " fast, browser-based MicroPython IDE for ESP32 with built-in REPL, Git, syntax checking, and flasher, no installation required!",
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
          { text: 'Using Git', link: '/docs/git' },
          { text: 'About the Command Palette', link: '/docs/command-palette' },
          { text: 'Flashing MicroPython', link: '/docs/flash-micropython' },
          { text: 'Troubleshooting', link: '/docs/troubleshooting' },
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Contributing for the first time', link: '/contributing/' },
          { text: 'Setting up a development environment', link: '/contributing/setting-up-environment' },
          { text: 'Building ty, the typechecker', link: '/contributing/build-ty' },
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
    socialLinks: [
      { icon: 'github', link: 'https://github.com/DubsterDev/MicroMonkey' }
    ]
  },
  cleanUrls: true,
  ignoreDeadLinks: true
})
