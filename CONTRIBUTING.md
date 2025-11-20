# Contributing

## Running MicroMonkey locally

After cloning the GitHub repository, you can run `npm run install` to make sure all the dependecies are installed.

Once all the dependecies are installed, you can start the development server at any time with the command `npm run dev`.

When the first change is made, the [README](README.md) should be updated to reflect the preparing for next beta stage.

## Brief Overview

All new functions should have a JSDoc, and ideally plenty of comments.

Most of the files should be pretty self-explanatory, but here's the basic ideas:
 - [commandPalette.js](web/src/commandPalette.js) contains the command palette that shows up when the user presses `CTRL+SHIFT+P`
 - [constants.js](web/src/constants.js) contains constants that are used in various places. Right now, this only includes the MicroMonkey version number
 - [customEditorHelperFunctions.js](web/src/customEditorHelperFunctions.js) contains helper functions for the render functions of custom editors
 - [editor.js](web/src/editor.js) has the bulk of the code for managing the Monaco editor, including showing autocompletions.
 - [fileExplorer.js](web/src/fileExplorer.js) is the main logic for rendering the file explorer on the left hand side of the IDE
 - [flasher.js](web/src/flasher.js) contains the code for flashing ESP32 devices. In the future, I would like to expand this to include support for more types of devices
 - [main.js](web/src/main.js) is the entrypoint. It's main job is starting the rest of the files
 - [openFilesManager.js](web/src/openFilesManager.js) is the tab manager and also holds the state of monaco models and calls custom editor render functions
 - [otherUiManager.js](web/src/otherUiManager.js) contains other random functions, like the context menu, launching a rename for folders and files, and has some render functions for the Welcome to MicroMonkey and What's New pages.
 - [pyrightManager.js](web/src/pyrightManager.js) is the layer between Monaco and the [pyright webworker](https://github.com/posit-dev/pyright/blob/pyright-browser/THIS_FORK.md), the built files for pyright are in [public/pyright](web/public/pyright/)
 - [serial.js](web/src/serial.js) is where all communication with the board happens, and it also controls the serial monitor and requesting a connection with the serial port
 - [settings.js](web/src/settings.js) contains all the logic for settings. This includes rendering the settings page and also has functions such as `getSetting` and `setSetting`
 - [style.css](web/src/style.css) is where all the styling for MicroMonkey is defined
 - [index.html](web/index.html) is where the main MicroMonkey interface is, but some things are added programmatically in the previously mentioned JavaScript files

## Deploying to Beta

When enough changes have been made, it's time to deploy MicroMonkey to beta. To do this, we must do the following:
 - Decide on a good version number for this release, and then add -beta to the end. (e.g. 1.2.0-beta)
 - The new version number should be set in [package.json](web/package.json) and [constants.js](web/src/constants.js)
 - A changelog for the new version number must be present in [CHANGELOG.md](CHANGELOG.md). There should be an Unreleased section which you can rename to the version number and add the date at the end, following the style of previous releases.
 - This changelog must be copied over to [otherUiManager.js](web/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run deploy-beta` (which will build MicroMonkey with Vite and then deploy with Firebase in beta) or `npm run build`, and then the built MicroMonkey can be found in the [dist folder](web/dist/)
 - Change the [README](README.md) to reflect the beta stage.

## Deploying to Release

Before a new version of MicroMonkey is released, several things need to be done:
 - MicroMonkey should have been tested in Beta for a week, following the prior section's instructions.
 - The version number should be changed to remove the `-beta` suffix in [package.json](web/package.json) and [constants.js](web/src/constants.js)
 - The changelog should be modified so the `-beta` suffix is removed in [CHANGELOG.md](CHANGELOG.md). Make sure that every substantial change is in here.
 - This changelog must be copied over to [otherUiManager.js](web/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run deploy` (which will build MicroMonkey with Vite and then deploy with Firebase in release) or `npm run build`, and then the built MicroMonkey can be found in the [dist folder](web/dist/)
 - Change the [README](README.md) to reflect the release stage, and tag the last commit for this version with the version number in the format `v1.2.0`.