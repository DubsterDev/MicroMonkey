# Setting up a development environment

First, you'll need to clone the GitHub repository. You might want to fork it first, but either way it's the same command as you always use to clone a git repo.

```bash
git clone https://github.com/DubsterDev/MicroMonkey
```

Then you can `cd MicroMonkey/core` and install the dependencies:

```bash
npm install
```

To see MicroMonkey in your browser, run `npm run core:dev` and open `localhost:5173`.

You **always** have to install the `core` dependencies if you want to develop any of the variants (besides docs, which isn't really a variant). Now, here's how to setup the different variants.

## Android

You don't need to manually install dependencies as Android Studio does this automatically, but you'll need to setup an apk signing key by running the following command (in the `android/` directory).

```bash
keytool -genkey -v -keystore key.keystore -alias micromonkey -keyalg RSA -keysize 2048 -validity 365000
```

You'll also need to add the `apksigner` to your PATH. You can [search to find out information about this](https://www.google.com/search?q=android+apksigner+add+to+path).

Most development of the Android version is done in Android Studio, but you won't see anything when unless you build MicroMonkey first, like this (run the command in the root directory of the MicroMonkey repo):

```bash
npm run android:build
```

Then you can run the app in Android Studio and you should see it on your phone or emulator.

## Electron

For the Electron app you'll have to install more dependencies. `cd` to the `electron/` folder and run `npm install`.

When you want to run the Electron variant, you'll have to build core and copy it to Electron by running the following command in the base directory of MicroMonkey:

```bash
npm run electron:build
```

Then you can start the Electron app by `cd`-ing to `electron` and running `npm run start`.

## Docs

You'll need to run `npm install` in the root of the MicroMonkey repository, then also from the base directory, you can run `npm run docs:dev` to run the development docs server.

If you want to see what the app looks like in a whole (including the IDE button), you'll have to build core:

```bash
npm run web:build
```

Then you can preview it like:

```bash
npm run docs:preview
```