import { readFileSync, writeFileSync } from "fs";

const version = process.argv[2];

// Web package.json
const webPackageJson = JSON.parse(readFileSync("web/package.json").toString());
webPackageJson["version"] = version;
writeFileSync("web/package.json", JSON.stringify(webPackageJson, null, 2));

// Constants.js
const constantsJs = readFileSync("web/src/constants.js").toString();
writeFileSync("web/src/constants.js", constantsJs.replace(/(?<=MICROMONKEY_VERSION = ").+(?=";)/g, version));

// Android gradle
const gradle = readFileSync("android/app/build.gradle.kts").toString();
writeFileSync("android/app/build.gradle.kts", 
    gradle.replace(/(?<=versionName = ").+(?=")/g, version)
    .replace(/(?<=versionCode = ).+/g, version.replaceAll(".", "").replaceAll("-", "").replace("beta", ""))
);