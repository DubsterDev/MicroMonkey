import { rmSync, cpSync } from "fs";

rmSync("docs/public/ide", {recursive: true, force: true});

cpSync("core/dist", "docs/public/ide", { recursive: true });