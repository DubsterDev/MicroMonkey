# Contributing for the first time

If you like using MicroMonkey and/or just want to contribute a new feature, it's fairly easy as MicroMonkey is open source on [GitHub](https://github.com/DubsterDev/MicroMonkey).

First though, you may want to understand the codebase, so here's a summary of what the codebase looks like by variant.

## Core (shared across all variants)

All new functions in JS files in `core/` should have a JSDoc and plenty of comments so other people can understand your code.

 - [communicationProtocols/androidSerial.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/communicationProtocols/androidSerial.js) contains code for communicating with the Android app's serial bridge.
 - [communicationProtocols/webSerial.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/communicationProtocols/webSerial.js) contains code for communicating using the Web Serial API.
 - [commandPalette.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/commandPalette.js) contains the command palette that shows up when the user presses `CTRL+SHIFT+P`
 - [constants.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/constants.js) contains constants that are used in various places. Right now, this only includes the MicroMonkey version number
 - [customEditorHelperFunctions.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/customEditorHelperFunctions.js) contains helper functions for the render functions of custom editors
 - [editor.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/editor.js) has the bulk of the code for managing the Monaco editor, including showing autocompletions.
 - [fileExplorer.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/fileExplorer.js) is the main logic for rendering the file explorer on the left hand side of the IDE
 - [flasher.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/flasher.js) contains the code for flashing devices.
 - [espFlasher.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/espFlasher.js) contains the code for flashing ESP32 devices.
 - [main.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/main.js) is the entrypoint. It's main job is starting the rest of the files
 - [openFilesManager.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/openFilesManager.js) is the tab manager and also holds the state of monaco models and calls custom editor render functions
 - [otherUiManager.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/otherUiManager.js) contains other random functions, like the context menu, launching a rename for folders and files, and has some render functions for the Welcome to MicroMonkey and What's New pages.
 - [tyManager.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/tyManager.js) is the layer between Monaco and the [ty typechecker](https://github.com/astral-sh/ty/), the built files for ty are in the [ty_wasm](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/ty_wasm/) directory, and the WASM code itself is in the [public](https://github.com/DubsterDev/MicroMonkey/blob/main/core/public/ty_wasm_bg.wasm) directory. To build these files, you can follow [these instructions](tutorials/Build%20ty.md).
 - [serial.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/serial.js) is where all communication with the board happens.
 - [settings.js](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/settings.js) contains all the logic for settings. This includes rendering the settings page and also has functions such as `getSetting` and `setSetting`
 - [style.css](https://github.com/DubsterDev/MicroMonkey/blob/main/core/src/style.css) is where all the styling for MicroMonkey is defined
 - [index.html](https://github.com/DubsterDev/MicroMonkey/blob/main/core/index.html) is where the main MicroMonkey interface is, but some things are added programmatically in the previously mentioned JavaScript files

## Android

The Android app is basically just the website in an Android WebView. The difference, though, is that mobile browsers typically **do not support WebSerial** making it necessary to have a native app.

The Android app mainly just creates a bridge between the phone's native serial interface and the browser.

There isn't much to say about the structure, as nearly everything happens in [MainActivity](https://github.com/DubsterDev/MicroMonkey/blob/main/android/app/src/main/java/app/web/micromonkey/MainActivity.kt).

## Electron

Now *this* is the variant that doesn't really have a huge purpose, but it has potential. It works offline, and you don't need a CORS Proxy to use Git remotes.

Check out [main.js](https://github.com/DubsterDev/MicroMonkey/blob/main/electron/main.js) for the creation logic, [preload.js](https://github.com/DubsterDev/MicroMonkey/blob/main/electron/preload.js) bridges MicroMonkey and main.js.

## Next steps

Now you know how the repo is structured. Now, let's see how to [setup your environment for the first time.](/contributing/setting-up-environment/)