import LightningFS from "@isomorphic-git/lightning-fs";
import { init, statusMatrix } from "isomorphic-git";
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

export async function renderChanges() {
    const changes = await statusMatrix({ fs, dir: `/${dir}` });

    const changesElement = document.getElementById("gitChangesArea");
    changesElement.innerHTML = "";

    changes.forEach(([path, headStatus, workDirStatus, stageStatus]) => {
        if (headStatus === 1 && workDirStatus === 1) return;

        const pathParts = path.split("/");
        
        const fileName = pathParts[pathParts.length - 1];
        const parentDir = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

        let changeType = "not_known";

        if (headStatus === 0) changeType = "untracked";
        else if (workDirStatus === 2) changeType = "modified";
        else if (stageStatus === 2) changeType = "staged";
        else if (stageStatus === 3) changeType = "staged_modified";

        const changeContainer = document.createElement("div");
        changeContainer.classList.add("change");

        const nameContainer = document.createElement("div");
        nameContainer.classList.add("name");

        const fileNameSpan = document.createElement("span");
        fileNameSpan.classList.add("filename");
        fileNameSpan.innerText = fileName;
        nameContainer.appendChild(fileNameSpan);

        const parentDirSpan = document.createElement("span");
        parentDirSpan.classList.add("parentDir");
        parentDirSpan.innerText = parentDir;
        nameContainer.appendChild(parentDirSpan);

        changeContainer.appendChild(nameContainer);

        const changeTypeSpan = document.createElement("span");
        changeTypeSpan.classList.add(changeType);
        changeTypeSpan.innerText = changeType.substring(0, 1).toUpperCase();
        changeContainer.appendChild(changeTypeSpan);

        changesElement.appendChild(changeContainer);
    });
}


// FS Helper Functions

export async function fsMkDir(dirName) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    const fsResult = await fs.mkdir(`/${dir}${dirName}`);

    await renderChanges();

    return fsResult;
}

export async function fsRmDir(dirName, options) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    const fsResult = await fs.rmdir(`/${dir}${dirName}`, options);

    await renderChanges();

    return fsResult;
}

export function fsReadDir(dirName, options) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    return fs.readdir(`/${dir}${dirName}`, options)
}

export async function fsRename(oldFilePath, newFilePath) {
    if (!oldFilePath.startsWith("/")) oldFilePath = "/" + oldFilePath;
    if (!newFilePath.startsWith("/")) newFilePath = "/" + newFilePath;

    const fsResult = await fs.rename(`/${dir}${oldFilePath}`, `/${dir}${newFilePath}`);

    await renderChanges();

    return fsResult;
}

export function fsStat(filePath) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.stat(`/${dir}${filePath}`, options);
}

export async function fsWriteFile(filePath, data, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    const fsResult = await fs.writeFile(`/${dir}${filePath}`, data, options);

    await renderChanges();

    return fsResult;
}

export function fsReadFile(filePath, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    return fs.readFile(`/${dir}${filePath}`, options);
}

export async function fsUnlink(filePath, options) {
    if (!filePath.startsWith("/")) filePath = "/" + filePath;

    const fsResult = await fs.unlink(`/${dir}${filePath}`, options)

    await renderChanges();

    return fsResult;
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

    await renderChanges();
}