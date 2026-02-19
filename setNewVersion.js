import { readFileSync, writeFileSync } from "fs";

const version = process.argv[2];

// Web package.json
const webPackageJson = JSON.parse(readFileSync("core/package.json").toString());
webPackageJson["version"] = version;
writeFileSync("core/package.json", JSON.stringify(webPackageJson, null, 2));

// Electron package.json
const electronPackageJson = JSON.parse(readFileSync("electron/package.json").toString());
electronPackageJson["version"] = version;
writeFileSync("electron/package.json", JSON.stringify(electronPackageJson, null, 2));

// Constants.js
const constantsJs = readFileSync("core/src/constants.js").toString();
writeFileSync("core/src/constants.js", constantsJs.replace(/(?<=MICROMONKEY_VERSION = ").+(?=";)/g, version));

// Android gradle
const gradle = readFileSync("android/app/build.gradle.kts").toString();
writeFileSync("android/app/build.gradle.kts", 
    gradle.replace(/(?<=versionName = ").+(?=")/g, version)
    .replace(/(?<=versionCode = ).+/g, version.replaceAll(".", "").replaceAll("-", "").replace("beta", ""))
);