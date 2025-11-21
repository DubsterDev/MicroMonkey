import { copyFile } from "fs";
const version = process.argv[2];

copyFile(`firebase.${version}.json`, `firebase.json`, () => {});