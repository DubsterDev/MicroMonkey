import { rmSync, cpSync } from "fs";

rmSync("android/app/src/main/assets", {recursive: true, force: true});

cpSync("web/dist", "android/app/src/main/assets", { recursive: true });