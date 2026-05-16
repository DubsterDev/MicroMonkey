# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-05-16

### Added
 - Git support

### Fixed
 - Wrong sized serial monitor - serial monitor now uses a monospace font

### Changed
 - Added a pointer instead of text cursor in actionable places

## [1.3.6] - 2026-04-23

### Fixed
 - Opening files with unicode characters in names
 - Close all tabs closes all tabs, including unsaved ones again
 - Uploading ZIP files with nested folders

## [1.3.5] - 2026-04-13

### Added
 - Ctrl+W shortcut to close tabs (doesn't work in browser)
 - Documentation and landing page

## [1.3.4] - 2026-03-04

### Fixed
 - Retrieving files from the connected board is now more reliable

### Added
 - Electron desktop app

## [1.3.3] - 2026-02-18

### Fixed
 - Ctrl+` shortcut on Linux
 - Automatic resizing of editor

### Changed
 - Type checker is now ty instead of pyright (#4)
 - Android app uses WebView again (#3)

## [1.3.2] - 2026-02-05

### Fixed
 - Rename action didn't launch rename action
 - Editor going off screen slightly

## [1.3.1] - 2026-01-05

### Changed
 - Doesn't automatically connect to device if not in focus

### Added
 - Mobile layout
 - Save button and command palette button in bottom bar
 - Expiremental support for running on Android via Android app

## [1.3.1-beta] - 2025-11-28

### Changed
 - Doesn't automatically connect to device if not shown
 - Use Android Custom Tab instead of WebView for Android app

## [1.3.0-beta] - 2025-11-24

### Added
 - Mobile layout
 - Save button and command palette button in bottom bar
 - Expiremental support for running on Android via Android app

## [1.2.1] - 2025-11-21

### Added
 - Monkey image when no tabs are opened
 - Reboot command to command palette

### Changed
 - Files and folder names overflow with an ellipsis instead of adding a scrollbar
 - Full paths can now be viewed for files and folders by hovering over the title in the file explorer
 - Renamed `File Explorer` to `Files`

### Fixed
 - Exception when trying to access the language ID on a undefined Monaco Model

## [1.2.0] - 2025-10-23

### Added
 - Keyboard shortcut CTRL+` for toggling serial monitor visibility
 - Beta upload files as ZIP functionality
 - Support for more commands in command palette
 - A command to connect to board in command palette
 - A command to toggle the serial monitor in the command palette

### Changed
 - Command palette is now sorted alphabetically when no search term has been provided

### Fixed
 - Command palette can no longer hide behind the editor
 - Tab strip shrinking when serial monitor is toggled

## [1.1.3] - 2025-10-10

### Added
 - Beta download as ZIP functionality

### Changed
 - Improved MicroPython flasher UI
 - Seperated logic for espressif devices in flasher to a seperate file

## [1.1.2] - 2025-10-01

### Added
 - Ability to use arrow keys to select command shown in command palette (`CTRL+SHIFT+P`)
 - Ability to request input with options
 - Ability to supply a title for the command palette

### Changed
 - Requests confirmation when closing an unsaved file

## [1.1.1] - 2025-10-01

### Added
 - Options to close tabs in context menu when right-clicking on a tab
 - Tab bar is now scrollable

### Changed
 - Made tabs change the locations they reference when they are renamed or they're parent directories are renamed so that it always references an existing file
 - Made custom editors (Welcome to MicroMonkey, Settings, etc), stay inside the right area

## [1.1.0] - 2025-09-30

### Added
 - What's New page
 - Builtin ESP32 flasher, accessible via `Command Palette (CTRL+SHIFT+P) > Flash MicroPython`
 - Syntax checking, autocompletion, and hover to view information about modules, classes, functions, and variables

### Changed
 - Made file actions always visible on root folder
 - Various internal modifications

[unreleased]: https://github.com/FXZFun/MicroMonkey/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.6...v1.4.0
[1.3.6]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.1-beta...v1.3.1
[1.3.1-beta]: https://github.com/FXZFun/MicroMonkey/compare/v1.3.0-beta...v1.3.1-beta
[1.3.0-beta]: https://github.com/FXZFun/MicroMonkey/compare/v1.2.1...v1.3.0-beta
[1.2.1]: https://github.com/FXZFun/MicroMonkey/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/FXZFun/MicroMonkey/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/FXZFun/MicroMonkey/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/FXZFun/MicroMonkey/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/FXZFun/MicroMonkey/compare/v1.1.0...v1.1.1