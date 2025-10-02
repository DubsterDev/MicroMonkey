# Changelog

## 1.1.3 (Upcoming)
 - Improved MicroPython flasher UI
 - Seperated logic for espressif devices in flasher to a seperate file

## 1.1.2
 - Added ability to use arrow keys to select command shown in command palette (`CTRL+SHIFT+P`)
 - Added ability to request input with options
 - Added ability to supply a title for the command palette
 - Made it so that it requests confirmation when closing an unsaved file

## 1.1.1
 - Added options to close tabs in context menu when right-clicking on a tab
 - Made tab bar scrollable
 - Made tabs change the locations they reference when they are renamed or they're parent directories are renamed so that it always references an existing file
 - Made custom editors (Welcome to MicroMonkey, Settings, etc), stay inside the right area

## 1.1.0
 - Added What's New page
 - Added builtin ESP32 flasher, accessible via `Command Palette (CTRL+SHIFT+P) > Flash MicroPython`
 - Added syntax checking, autocompletion, and hover to view information about modules, classes, functions, and variables
 - Made file actions always visible on root folder
 - Various internal modifications