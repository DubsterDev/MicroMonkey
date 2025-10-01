# MicroMonkey

MicroMonkey is a web-based IDE for managing code on MicroPython devices.

## Features
 - Serial Monitor
 - File Explorer
 - Multiple tabs
 - Create files/folders
 - Rename files/folders
 - Delete files/folders

## To-do
 - **Best Practices**
   - Tests
 - **Tab Bar**
   - When renaming files/folders change tab locations
   - Close all tabs/saved tabs option in tab bar
   - Make tab bar scrollable
 - **Editor**
   - Make pyright use the passed `pyrightconfig.json` instead of ignoring it
  - **Miscellaneous**
    - Make built-in MicroPython flasher more user friendly

## Contributing

### Running MicroMonkey locally

After cloning the GitHub repository, you can run `npm run install` to make sure all the dependecies are installed.

Once all the dependecies are installed, you can start the development server at any time with the command `npm run dev`.

### Brief Overview

All new functions should have a JSDoc, and ideally plenty of comments.

Most of the files should be pretty self-explanatory, but here's the basic ideas:
 - [commandPalette.js](src/commandPalette.js) contains the command palette that shows up when the user presses `CTRL+SHIFT+P`
 - [constants.js](src/constants.js) contains constants that are used in various places. Right now, this only includes the MicroMonkey version number
 - [customEditorHelperFunctions.js](src/customEditorHelperFunctions.js) contains helper functions for the render functions of custom editors
 - [editor.js](src/editor.js) has the bulk of the code for managing the Monaco editor, including showing autocompletions.
 - [fileExplorer.js](src/fileExplorer.js) is the main logic for rendering the file explorer on the left hand side of the IDE
 - [flasher.js](src/flasher.js) contains the code for flashing ESP32 devices. In the future, I would like to expand this to include support for more types of devices
 - [main.js](src/main.js) is the entrypoint. It's main job is starting the rest of the files
 - [openFilesManager.js](src/openFilesManager.js) is the tab manager and also holds the state of monaco models and calls custom editor render functions
 - [otherUiManager.js](src/otherUiManager.js) contains other random functions, like the context menu, launching a rename for folders and files, and has some render functions for the Welcome to MicroMonkey and What's New pages.
 - [pyrightManager.js](src/pyrightManager.js) is the layer between Monaco and the [pyright webworker](https://github.com/posit-dev/pyright/blob/pyright-browser/THIS_FORK.md), the built files for pyright are in [public/pyright](public/pyright/)
 - [serial.js](src/serial.js) is where all communication with the board happens, and it also controls the serial monitor and requesting a connection with the serial port
 - [settings.js](src/settings.js) contains all the logic for settings. This includes rendering the settings page and also has functions such as `getSetting` and `setSetting`
 - [style.css](src/style.css) is where all the styling for MicroMonkey is defined
 - [index.html](index.html) is where the main MicroMonkey interface is, but some things are added programmatically in the previously mentioned JavaScript files

### Getting ready for deploying

Before a new version of MicroMonkey is released, several things need to be updated:

 - The new version number should be set in [package.json](package.json) and [constants.js](src/constants.js)
 - A changelog for the new version number must be present in [CHANGELOG.md](CHANGELOG.md)
 - This changelog must be copied over to [otherUiManager.js](src/otherUiManager.js) on line 173
 - Then you can deploy the changes with `npm run deploy` (which will build MicroMonkey with Vite and then deploy with Firebase), or `npm run build`, and then the built MicroMonkey can be found in the [dist folder](dist/)