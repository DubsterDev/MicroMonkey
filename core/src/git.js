import LightningFS from "@isomorphic-git/lightning-fs";
import { init, statusMatrix, add, remove, commit, resetIndex, walk, TREE, readBlob, resolveRef, setConfig } from "isomorphic-git";
import { Buffer } from "buffer";
import { getInput } from "./commandPalette";
import { createModel } from "./editor";
import { addAllFilesToFS, openTab } from "./openFilesManager";
import { getFile, writeFile } from "./serial";

window.Buffer = Buffer;

let dir = "bob";
const fs = new LightningFS("fs").promises;
const originalModel = createModel("", `file://micromonkey/fileatgithead.mm`);

export async function setupGit() {
    const repo = await getFile("/.mmgitrepo");
    let repoExists = true;
    try {
        const stats = await fs.stat(`/${repo}`)
    } catch {
        repoExists = false;
    }
    
    if (repo && repo.trim() !== "" && repoExists) {
        dir = repo;
        
        await addAllFilesToFS();
        gitRepoReady();
    } else {
        document.getElementById("gitNotEnabled").style.display = "block";
    }
    document.getElementById("gitLoading").style.display = "none";
    
    document
        .getElementById("gitCommitButton")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            commitStaged();
        });
    document
        .getElementById("enableGit")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            enableGit();
        });
}

async function enableGit() {
    const ready = await getInput("We're going to ask you a few questions to setup your git. Ready?", '', '', ['Yes, continue', 'No, cancel'], false);

    if (!ready || ready === 'No, cancel') return;

    
    const authorName = await getInput("What name would you like to use?", '');
    const authorEmail = await getInput("What email would you like to use?", '');
    const repoName = await getInput("Give a name to your new Git repo", "It needs to be unique");

    if (authorName && authorName.trim() !== "" && authorEmail && authorEmail.trim() !== "" && repoName && repoName.trim() !== "") {
        getInput("Initializing repo (we'll let you know when it's done)", '', '', ['Okay'], false);

        
        await initializeRepo(repoName);
        await writeFile(repoName, "/.mmgitrepo");
        
        dir = repoName;
        
        await addAllFilesToFS();
        
        await setConfig({ fs, dir: `/${dir}`, path: 'user.name', value: authorName });
        await setConfig({ fs, dir: `/${dir}`, path: 'user.email', value: authorEmail });
        
        getInput("All done, your repo is ready for you", '', '', ['Okay'], false);
        
        gitRepoReady();
    }
}

function gitRepoReady() {
    document.getElementById("gitNotEnabled").style.display = "none";
    document.getElementById("gitEnabled").style.display = "block";
}

export async function initializeRepo(name) {
    await fs.mkdir("/" + name);
    await init({ fs, defaultBranch: "main", dir: "/" + name });
}

export async function renderChanges() {
    const changes = await statusMatrix({ fs, dir: `/${dir}` });

    const changesElement = document.getElementById("gitChangesArea");
    changesElement.innerHTML = "";

    changes.forEach(([path, headStatus, workDirStatus, stageStatus]) => {
        if (headStatus === 1 && workDirStatus === 1) return;

        const pathParts = path.split("/");

        const fileName = pathParts[pathParts.length - 1];
        const parentDir =
            pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

        let changeType = "not_known";

        if (stageStatus === 2) changeType = "staged";
        else if (stageStatus === 3) changeType = "staged_modified";
        else if (headStatus === 0) changeType = "untracked";
        else if (workDirStatus === 2) changeType = "modified";
        else if (headStatus === 1 && workDirStatus === 0 && stageStatus === 0) changeType = "deleted";
        else if (headStatus === 1 && workDirStatus === 0 && stageStatus === 1) changeType = "deleted_unstaged";

        const changeContainer = document.createElement("div");
        changeContainer.classList.add("change");

        changeContainer.addEventListener("click", async (ev) => {
            const oid = await resolveRef({
              fs,
              dir: `/${dir}`,
              ref: 'HEAD'
            });
            
            const { blob } = await readBlob({
              fs,
              dir: `/${dir}`,
              oid: oid,
              filepath: path
            });
            
            const originalContents = Buffer.from(blob).toString("utf8");
            originalModel.setValue(originalContents);

            await openTab(`/${path}`);
            openTab(`/${path}`, `Changes to ${fileName}`, "monaco-diff", null, originalModel);
        })

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

        const changeTypeAndCheckboxContainer = document.createElement("div");
        changeTypeAndCheckboxContainer.classList.add("stageArea");

        const changeTypeSpan = document.createElement("span");
        changeTypeSpan.classList.add(changeType);
        changeTypeSpan.innerText = changeType.substring(0, 1).toUpperCase();
        changeTypeAndCheckboxContainer.appendChild(changeTypeSpan);

        const stageCheckbox = document.createElement("input");
        stageCheckbox.type = "checkbox";

        if (changeType === "staged" || changeType === "deleted") {
            stageCheckbox.checked = true;
        } else if (changeType === "staged_modified") {
            stageCheckbox.checked = true;
            stageCheckbox.indeterminate = true;
        }

        stageCheckbox.addEventListener("click", (ev) => ev.stopPropagation())

        stageCheckbox.addEventListener("change", async () => {
            if (stageCheckbox.checked) {
                if (changeType === "deleted_unstaged") {
                    await remove({ fs, dir: `/${dir}`, filepath: path });
                } else {
                    await add({ fs, dir: `/${dir}`, filepath: path });
                }
            } else {
                await resetIndex({ fs, dir: `/${dir}`, filepath: path });
            }
            renderChanges();
        });

        changeTypeAndCheckboxContainer.appendChild(stageCheckbox);

        changeContainer.appendChild(changeTypeAndCheckboxContainer);

        changesElement.appendChild(changeContainer);
    });
}

export async function commitStaged() {
    const gitCommitMessage = document.getElementById("gitCommitMessage");
    let message = gitCommitMessage.value;
    if (message.trim().length === 0) {
        message = await getInput(
            "Enter a commit message",
            "Enter a commit message",
        );
        if (message === undefined || message.trim().length === 0) {
            await getInput(
                "A commit message is required",
                "Try committing again",
                "",
                ["Okay"],
                false,
            );
            return;
        }
    }
    await commit({ fs, dir: `/${dir}`, message });
    gitCommitMessage.value = "";
    renderChanges();
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

    return fs.readdir(`/${dir}${dirName}`, options);
}

export async function fsRename(oldFilePath, newFilePath) {
    if (!oldFilePath.startsWith("/")) oldFilePath = "/" + oldFilePath;
    if (!newFilePath.startsWith("/")) newFilePath = "/" + newFilePath;

    const fsResult = await fs.rename(
        `/${dir}${oldFilePath}`,
        `/${dir}${newFilePath}`,
    );

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

    const fsResult = await fs.unlink(`/${dir}${filePath}`, options);

    await renderChanges();

    return fsResult;
}

export async function fsDeleteRecursively(path) {
    if (!path.startsWith("/")) path = "/" + path;
    
    return fsEmptyDir(`/${dir}${path}`)
}

export async function fsEmptyDir(originalPath) {
    if (!originalPath) originalPath = `/${dir}`;
    const dirContents = await fs.readdir(originalPath);
    for (const path of dirContents) {
        if (path === ".git") continue;
        try {
            const fullPath = originalPath + "/" + path;
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                if ((await fs.readdir(fullPath)).length)
                    await fsEmptyDir(fullPath);

                fs.rmdir(fullPath);
            } else fs.unlink(fullPath);
        } catch (e) {
            console.error(e);
        }
    }

    await renderChanges();
}
