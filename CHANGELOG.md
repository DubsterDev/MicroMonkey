# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.3.0-beta (2025-11-24)

### Added
 - Mobile layout
 - Save button and command palette button in bottom bar
 - Expiremental support for running on Android via Android app

## 1.2.1 (2025-11-21)

### Added
 - Monkey image when no tabs are opened
 - Reboot command to command palette

### Changed
 - Files and folder names overflow with an ellipsis instead of adding a scrollbar
 - Full paths can now be viewed for files and folders by hovering over the title in the file explorer
 - Renamed `File Explorer` to `Files`

### Fixed
 - Exception when trying to access the language ID on a undefined Monaco Model

## 1.2.0 (2025-10-23)

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

## 1.1.3 (2025-10-10)

### Added
 - Beta download as ZIP functionality

### Changed
 - Improved MicroPython flasher UI
 - Seperated logic for espressif devices in flasher to a seperate file

## 1.1.2 (2025-10-01)

### Added
 - Ability to use arrow keys to select command shown in command palette (`CTRL+SHIFT+P`)
 - Ability to request input with options
 - Ability to supply a title for the command palette

### Changed
 - Requests confirmation when closing an unsaved file

## 1.1.1 (2025-10-01)

### Added
 - Options to close tabs in context menu when right-clicking on a tab
 - Tab bar is now scrollable

### Changed
 - Made tabs change the locations they reference when they are renamed or they're parent directories are renamed so that it always references an existing file
 - Made custom editors (Welcome to MicroMonkey, Settings, etc), stay inside the right area

## 1.1.0 (2025-09-30)

### Added
 - What's New page
 - Builtin ESP32 flasher, accessible via `Command Palette (CTRL+SHIFT+P) > Flash MicroPython`
 - Syntax checking, autocompletion, and hover to view information about modules, classes, functions, and variables

### Changed
 - Made file actions always visible on root folder
 - Various internal modifications