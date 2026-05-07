import LightningFS from "@isomorphic-git/lightning-fs";
import { init, branch } from "isomorphic-git";
import { Buffer } from "buffer";
import * as git from "isomorphic-git";

window.Buffer = Buffer;

const dir = "bob";
const fs = new LightningFS('fs').promises;
export function setupGit() {
    window.fs = fs;
    window.init = initializeRepo;
    window.git = git;
}

export async function initializeRepo(name) {
    await fs.mkdir("/" + name)
    await init({ fs, defaultBranch: "main", dir: "/" + name })
}


// FS Helper Functions

export function fsMkDir(dirName) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    return fs.mkdir(`/${dir}${dirName}`)
}

export function fsRmDir(dirName, options) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    return fs.rmdir(`/${dir}${dirName}`, options);
}

export function fsReadDir(dirName, options) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    return fs.readdir(`/${dir}${dirName}`, options)
}

export function fsRename(oldFilePath, newFilePath) {
    if (!oldFilePath.startsWith("/")) oldFilePath = "/" + oldFilePath;
    if (!newFilePath.startsWith("/")) newFilePath = "/" + newFilePath;

    return fs.rename(`/${dir}${oldFilePath}`, `/${dir}${newFilePath}`);
}

export function fsStat(filePath) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.stat(`/${dir}${filePath}`, options);
}

export function fsWriteFile(filePath, data, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.writeFile(`/${dir}${filePath}`, data, options);
}

export function fsReadFile(filePath, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.readFile(`/${dir}${filePath}`, options);
}

export function fsUnlink(filePath, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.unlink(`/${dir}${filePath}`, options)
}

export async function fsEmptyDir(originalPath) {
    if (!originalPath) originalPath = `/${dir}/`;
    const dirContents = await fs.readdir(originalPath);
    for (const path of dirContents) {
        if (path === ".git") continue;
        try {
            const fullPath = originalPath + path;
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                if ((await fs.readdir(fullPath)).length) await fsEmptyDir(fullPath);
                
                fs.rmdir(fullPath);
            } else fs.unlink(fullPath);
        } catch (e) {
            console.error(e);
        }
    }
}