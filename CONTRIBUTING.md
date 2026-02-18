# Contributing

## Running MicroMonkey locally

After cloning the GitHub repository, `cd` to `core`, and then you can run `npm run install` to make sure all the dependecies are installed.

Once all the dependecies are installed, you can start the development server at any time with the command `npm run dev`.

## Brief Overview

All new functions should have a JSDoc, and ideally plenty of comments.

Most of the files should be pretty self-explanatory, but here's the basic ideas:
 - [commandPalette.js](core/src/commandPalette.js) contains the command palette that shows up when the user presses `CTRL+SHIFT+P`
 - [constants.js](core/src/constants.js) contains constants that are used in various places. Right now, this only includes the MicroMonkey version number
 - [customEditorHelperFunctions.js](core/src/customEditorHelperFunctions.js) contains helper functions for the render functions of custom editors
 - [editor.js](core/src/editor.js) has the bulk of the code for managing the Monaco editor, including showing autocompletions.
 - [fileExplorer.js](core/src/fileExplorer.js) is the main logic for rendering the file explorer on the left hand side of the IDE
 - [flasher.js](core/src/flasher.js) contains the code for flashing ESP32 devices. In the future, I would like to expand this to include support for more types of devices
 - [main.js](core/src/main.js) is the entrypoint. It's main job is starting the rest of the files
 - [openFilesManager.js](core/src/openFilesManager.js) is the tab manager and also holds the state of monaco models and calls custom editor render functions
 - [otherUiManager.js](core/src/otherUiManager.js) contains other random functions, like the context menu, launching a rename for folders and files, and has some render functions for the Welcome to MicroMonkey and What's New pages.
 - [tyManager.js](core/src/tyManager.js) is the layer between Monaco and the [ty typechecker](https://github.com/astral-sh/ty/), the built files for ty are in the [ty_wasm](core/src/ty_wasm/) directory, and the WASM code itself is in the [public](core/public/ty_wasm_bg.wasm) directory. To build these files, you can follow [these instructions](tutorials/Build%20ty.md).
 - [serial.js](core/src/serial.js) is where all communication with the board happens, and it also controls the serial monitor and requesting a connection with the serial port
 - [settings.js](core/src/settings.js) contains all the logic for settings. This includes rendering the settings page and also has functions such as `getSetting` and `setSetting`
 - [style.css](core/src/style.css) is where all the styling for MicroMonkey is defined
 - [index.html](core/index.html) is where the main MicroMonkey interface is, but some things are added programmatically in the previously mentioned JavaScript files

Under [android](android/), is a small WebView wrapper app to allow running MicroMonkey on Android, due to the fact that the Web Serial API is not supported there yet. In the root of the micromonkey project, you will want to build the website first (with `npm run build-android`), and then running the Android app will work.

## Deploying to Beta

When enough changes have been made, it's time to deploy MicroMonkey to beta. To do this, we must do the following:
 - Decide on a good version number for this release, and then add -beta to the end. (e.g. 1.2.0-beta)
 - The new version number should be set everywhere, using the set version command. You can run it with `node setNewVersion.js [VERSION_NUMBER]` from the root of the project.
 - A changelog for the new version number must be present in [CHANGELOG.md](CHANGELOG.md). There should be an Unreleased section which you can rename to the version number and add the date at the end, following the style of previous releases.
 - This changelog must be copied over to [otherUiManager.js](core/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run deploy-beta-web` (which will build MicroMonkey with Vite and then deploy with Firebase in beta) or `npm run build-web`, and then the built MicroMonkey can be found in the [dist folder](core/dist/)
 - If you want to also release the Android version, you can run `npm run build-android-apk`, and it will prompt you for your keystore password. [See here to set up the keystore](#setting-up-for-the-android-app). Then, the APK can be found [here](android/app/build/outputs/apk/release/app-release.apk).

## Deploying to Release

Before a new version of MicroMonkey is released, several things need to be done:
 - MicroMonkey should have been tested in Beta for a week, following the prior section's instructions.
 - The version number should be changed to remove the `-beta` suffix. You can run `node setNewVersion.js [VERSION_NUMBER]` from the root of the project with the new version number.
 - The changelog should be modified so the `-beta` suffix is removed in [CHANGELOG.md](CHANGELOG.md). Make sure that every substantial change is in here.
 - This changelog must be copied over to [otherUiManager.js](core/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run deploy-web` (which will build MicroMonkey with Vite and then deploy with Firebase in release) or `npm run build-web`, and then the built MicroMonkey can be found in the [dist folder](core/dist/)
 - Tag the last commit for this version with the version number in the format `v1.2.0`.

## Setting up for the Android app
Before being able to build the android app, you'll have to create a keystore, using the following command: `keytool -genkey -v -keystore key.keystore -alias micromonkey -keyalg RSA -keysize 2048 -validity 365000`, in the [android](android/) directory.

You'll also need to add the `apksigner.bat` to your PATH. You can [search to find out information about this](https://www.google.com/search?q=android+apksigner+add+to+path)