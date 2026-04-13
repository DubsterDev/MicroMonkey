---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "MicroMonkey"
  tagline: A fast, browser-based IDE for MicroPython development
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
      light: "./icons/terminal-light.svg"
      dark: "./icons/terminal-dark.svg"
    title: Integrated REPL
    details: "See the output of your code right in the editor"
  - icon:
      light: "./icons/desktop-light.svg"
      dark: "./icons/desktop-dark.svg"
    title: Clean, easy to use interface
    details: "Finally, a modern design for MicroPython development"
  - icon:
      light: "./icons/code-light.svg"
      dark: "./icons/code-dark.svg"
    title: Syntax checking
    details: "Get instant feedback for issues with your code"
  - icon:
      light: "./icons/board-light.svg"
      dark: "./icons/board-dark.svg"
    title: Built-in MicroPython flasher
    details: "Flash MicroPython to your ESP32 boards without needing another tool"


---

<style>
  .hero-image {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(128, 128, 128, 0.47);
  }
</style>

<img src="/docs/images/overview.png" class="hero-image" alt="Screenshot of the MicroMonkey IDE">

## Start instantly - no installation or sign up

MicroMonkey runs entirely in your browser, making it great for class environments and easy access.

## Works on almost any device

MicroMonkey is fully browser-based. It works on many devices, like laptops, desktops, and Chromebooks.

## Everything in one place

No more switching to the terminal to run `mpremote` just to test your code, flash MicroPython, or use the REPL. MicroMonkey keeps it all in one place.

It also includes syntax checking and autocomplete for MicroPython.

## Start coding in seconds

[Launch MicroMonkey](/ide/){target=_self}, plug in your device, and start coding.