---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "MicroMonkey"
  tagline: A fast, browser-based IDE for ESP32 MicroPython development
  image:
    src: ./logo.svg
    alt: MicroMonkey logo
  actions:
    - theme: brand
      text: Launch IDE
      link: /ide/
      target: _self
    - theme: alt
      text: Documentation
      link: /docs/quickstart

features:
  - icon:
      light: "/icons/terminal-light.svg"
      dark: "/icons/terminal-dark.svg"
    title: Integrated REPL
    details: "See the output of your code right in the editor"
  - icon:
      light: "/icons/desktop-light.svg"
      dark: "/icons/desktop-dark.svg"
    title: Clean, easy to use interface
    details: "A modern interface for MicroPython development"
  - icon:
      light: "/icons/code-light.svg"
      dark: "/icons/code-dark.svg"
    title: Syntax checking
    details: "Get instant feedback for issues with your code"
  - icon:
      light: "/icons/board-light.svg"
      dark: "/icons/board-dark.svg"
    title: Built-in MicroPython flasher
    details: "Flash MicroPython to your ESP32 boards without needing another tool"


---

<style>
  .hero-video {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(128, 128, 128, 0.47);
    width: 100%;
    max-width: 918px;
    margin: auto;
  }

  .hero-video.dark {
    display: none;
  }

  .dark .hero-video.light {
    display: none;
  }

  .dark .hero-video.dark {
    display: block;
  }
</style>

<video src="/demo-light-loop.webm" class="hero-video light" autoplay muted loop></video>
<video src="/demo-dark-loop.webm" class="hero-video dark" autoplay muted loop></video>

## Start instantly - no installation or sign up required

MicroMonkey is a browser-based MicroPython IDE for ESP32 development, with no installation required!

Built-in MicroPython flashing eliminates the need for multiple tools, and best of all: works on any device with Chrome or a Chromium-based browser, including Chromebooks!

## Everything you need for ESP32 MicroPython development: REPL, flashing, and editing in one place

Tired of switching to the terminal to run `mpremote` just to test your code, flash MicroPython, or use the REPL? Enter MicroMonkey: The MicroPython IDE that keeps it all in one place.

It also includes syntax checking and autocomplete for MicroPython, saving you from those small mistakes you normally wouldn't notice until you ran your code.

## MicroPython IDE for ESP32 vs Thonny

Looking for a modern alternative to Thonny for ESP32 development? MicroMonkey has a sleek, easy-to-use UI, and you don't have to install anything. With an integrated REPL, flashing tools, and file explorer, MicroMonkey makes it easy to get started fast.

## No plugins required, unlike VS Code

If you were to use VS Code for MicroPython development, you would have to install a lot of plugins, or rely on the command line for syncing with your board.

MicroMonkey changes that: no need to install plugins, use the command line, or do complex installation steps. And it also uses the Monaco editor (the same core editor that powers VS Code), providing a rich user experience, and built-in syntax checking and autocompletion for MicroPython.

## What is MicroMonkey?

MicroMonkey is a fast, lightweight ESP32 MicroPython IDE that runs entirely in your browser. It combines a code editor, REPL, file manager, and flashing tools into a single browser-based environment, eliminating the need for setup or local tools.

## Start coding in seconds

So what are you waiting for? [Launch the IDE](/ide/){target=_self}, plug in your device, and start coding.