# Contributing

See [the MicroMonkey docs for instructions](https://micromonkey.web.app/contributing/).

## Deploying to Beta

Currently not deploying to beta. Skip to deploying to production.

<!--When enough changes have been made, it's time to deploy MicroMonkey to beta. To do this, we must do the following:
 - Decide on a good version number for this release, and then add -beta to the end. (e.g. 1.2.0-beta)
 - The new version number should be set everywhere, using the set version command. You can run it with `node setNewVersion.js [VERSION_NUMBER]` from the root of the project.
 - A changelog for the new version number must be present in [CHANGELOG.md](CHANGELOG.md). There should be an Unreleased section which you can rename to the version number and add the date at the end, following the style of previous releases.
 - This changelog must be copied over to [otherUiManager.js](core/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run web:deploy-beta` (which will build MicroMonkey with Vite and then deploy with Firebase in beta) or `npm run web:build`, and then the built MicroMonkey can be found in the [dist folder](core/dist/)
 - If you want to also release the Android version, you can run `npm run android:build-apk`, and it will prompt you for your keystore password. [See here to set up the keystore](#setting-up-for-the-android-app). Then, the APK can be found [here](android/app/build/outputs/apk/release/app-release.apk).-->

## Deploying to Release

Before a new version of MicroMonkey is released, several things need to be done:
 - MicroMonkey should have been tested in Beta for a week, following the prior section's instructions.
 - The version number should be changed to remove the `-beta` suffix. You can run `node setNewVersion.js [VERSION_NUMBER]` from the root of the project with the new version number.
 - The changelog should be modified so the `-beta` suffix is removed in [CHANGELOG.md](CHANGELOG.md). Make sure that every substantial change is in here.
 - This changelog must be copied over to [otherUiManager.js](core/src/otherUiManager.js) on line 208, obviously modified to fit the right format.
 - Then you can deploy the changes with `npm run web:deploy` (which will build MicroMonkey with Vite and then deploy with Firebase in release) or `npm run web:build`, and then the built MicroMonkey can be found in the [dist folder](core/dist/)
 - Tag the last commit for this version with the version number in the format `v1.2.0`.