import { rmSync, cpSync } from "fs";

rmSync("electron/dist", {recursive: true, force: true});

cpSync("core/dist", "electron/dist", { recursive: true });