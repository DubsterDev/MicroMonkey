import LightningFS from "@isomorphic-git/lightning-fs";
import { init, statusMatrix, add, remove, commit, resetIndex, walk, TREE, readBlob, resolveRef, setConfig, log, listFiles } from "isomorphic-git";
import { Buffer } from "buffer";
import { addCommand, getInput, removeCommand } from "./commandPalette";
import { createModel } from "./editor";
import { addAllFilesToFS, openTab, requestReRender } from "./openFilesManager";
import { getFile, writeFile } from "./serial";
import { addHeading } from "./customEditorHelperFunctions";
import { toggleSidebar } from "./otherUiManager";
import JSZip from "jszip";

// Expose Buffer to Buffer for Git
window.Buffer = Buffer;

// The git repo currently in use
let dir = "bob";

// Create a new LightningFS fs
const fs = new LightningFS("fs").promises;

// Create models for the diff editor
const originalModel = createModel("", `file://micromonkey/fileatgithead.mm`);
const modifiedModel = createModel("", `file://micromonkey/fileatgithead2.mm`);

/**
 * Add event listeners and check if Git is enabled.
 */
export async function setupGit() {
    // Retrieve .mmgitrepo from board
    const repo = await getFile("/.mmgitrepo");

    // Check if the repo mentioned in .mmgitrepo exists
    let repoExists = true;
    try {
        await fs.stat(`/${repo}`)
    } catch {
        repoExists = false;
    }
    
    if (repo && repo.trim() !== "" && repoExists) {
        // If the repo exists, set the dir to repo
        dir = repo;

        // Download all files from the board, and prepare git for use
        await addAllFilesToFS();
        gitRepoReady();
    } else {
        // If there is no git repo, add event listeners for the enable button
        addCommand("gitInitialize", "[Git] Enable", enableGit);
        document.getElementById("gitNotEnabled").style.display = "block";
    }

    // Hide the git loading message
    document.getElementById("gitLoading").style.display = "none";

    // Add event listeners to buttons
    document
        .getElementById("gitCommitButton")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            commitStaged();
        });
    document
        .getElementById("gitCommitMessage")
        .addEventListener("keyup", (ev) => {
            if (ev.ctrlKey && ev.key === "Enter") {
                commitStaged();
            }
        });
    document
        .getElementById("enableGit")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            enableGit();
        });
    document
        .getElementById("gitCommitHistoryButton")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            openCommitHistory();
        });
    document
        .getElementById("reloadGit")
        .addEventListener("click", (ev) => {
            ev.stopPropagation();
            reloadGit();
        });
}

/**
 * Ask the user for information about the new Git repo and initializes it
 */
async function enableGit() {
    // Verify the user is ready
    const ready = await getInput("We're going to ask you a few questions to setup your git repo. Ready?", '', '', ['Yes, continue', 'No, cancel'], false);

    // If the user is not ready, exit
    if (!ready || ready === 'No, cancel') return;

    // Ask the user a few questions
    const authorName = await getInput("What name would you like to use when committing?", '');
    const authorEmail = await getInput("What email would you like to use when commiting?", '');
    const repoName = await getInput("What would you like to name your git repo?", "It needs to be unique");

    if (authorName && authorName.trim() !== "" && authorEmail && authorEmail.trim() !== "" && repoName && repoName.trim() !== "") {
        // If the user answered all the questions, show a success message
        getInput("Initializing repo (we'll let you know when it's done)", '', '', ['Okay'], false);

        // Create the Git repo
        await initializeRepo(repoName);

        // Save the name of the board and set the active repo to the new repo
        await writeFile(repoName, "/.mmgitrepo");
        dir = repoName;

        // Download all files from the board
        await addAllFilesToFS();

        // Set the committer's name and email
        await setConfig({ fs, dir: `/${dir}`, path: 'user.name', value: authorName });
        await setConfig({ fs, dir: `/${dir}`, path: 'user.email', value: authorEmail });

        // Let the user know the repo is ready
        getInput("All done, your repo is ready for you", '', '', ['Okay'], false);

        // Display the right screen in panel
        gitRepoReady();
    }
}

/**
 * Change which commands are visible in command palette and swap the view in the Git panel.
 */
function gitRepoReady() {
    // Remove the enable command
    removeCommand("gitInitialize");

    // Add commands for managing Git
    addCommand("gitCommitStaged", "[Git] Commit Staged Changes", commitStaged);
    addCommand("gitOpenCommitHistory", "[Git] Open Commit History", openCommitHistory);
    addCommand("gitReload", "[Git] Reload", reloadGit);
    addCommand("gitDownloadAsZip", "[Git] Download .git folder as ZIP", downloadGitAsZip);

    // Swap the view in the right panel to the enabled state
    document.getElementById("gitNotEnabled").style.display = "none";
    document.getElementById("gitEnabled").style.display = "flex";

    // Update commit history if needed
    updateGraph();
}

/**
 * Reload git
 */
async function reloadGit() {
    // Re-download files from board
    await addAllFilesToFS();

    // Get git side panel ready
    gitRepoReady();

    // Update the commit history
    updateGraph();

    // Update the modified files view
    renderChanges();
}

/**
 * Create a repo in the specified directory
 * @param {string} name The repo name/directory to use
 */
async function initializeRepo(name) {
    // Create a new directory
    await fs.mkdir("/" + name);

    // Initialize git in that directory
    await init({ fs, defaultBranch: "main", dir: "/" + name });
}

/**
 * Remove commands from command palette and reset the view in the Git panel to loading.
 */
export async function cleanUpGit() {
    // Remove commands
    removeCommand("gitInitialize");
    removeCommand("gitCommitStaged");
    removeCommand("gitOpenCommitHistory");
    removeCommand("gitReload");
    removeCommand("gitDownloadAsZip");

    // Reset view to loading
    document.getElementById("gitLoading").style.display = "block";
    document.getElementById("gitNotEnabled").style.display = "none";
    document.getElementById("gitEnabled").style.display = "none";
}

/**
 * Render changes in files
 */
async function renderChanges() {
    // Get the changes from Git
    const changes = await statusMatrix({ fs, dir: `/${dir}` });

    // Clear the changes element
    const changesElement = document.getElementById("gitChangesArea");
    changesElement.innerHTML = "";

    // Loop through the changes
    changes.forEach(([path, headStatus, workDirStatus, stageStatus]) => {
        // If nothing changed, skip it
        if (headStatus === 1 && workDirStatus === 1) return;

        // Split the path into filename and directory
        const pathParts = path.split("/");

        const fileName = pathParts[pathParts.length - 1];
        const parentDir =
            pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

        // Find the change type
        let changeType = "not_known";

        if (stageStatus === 2) changeType = "staged";
        else if (stageStatus === 3) changeType = "staged_modified";
        else if (headStatus === 0) changeType = "untracked";
        else if (workDirStatus === 2) changeType = "modified";
        else if (headStatus === 1 && workDirStatus === 0 && stageStatus === 0) changeType = "deleted";
        else if (headStatus === 1 && workDirStatus === 0 && stageStatus === 1) changeType = "deleted_unstaged";

        // Create a new change container
        const changeContainer = document.createElement("div");
        changeContainer.classList.add("change");

        // On click, open the diff viewer
        changeContainer.addEventListener("click", async (ev) => {
            // Get the oid
            const oid = await resolveRef({
              fs,
              dir: `/${dir}`,
              ref: 'HEAD'
            });

            // Get the blob from Git
            const { blob } = await readBlob({
              fs,
              dir: `/${dir}`,
              oid: oid,
              filepath: path
            });

            // Convert the blob to a string
            const originalContents = Buffer.from(blob).toString("utf8");

            // Update the model with the original contents
            originalModel.setValue(originalContents);

            // Hide the sidebar if open
            toggleSidebar("right");

            // Open tabs
            await openTab(`/${path}`);
            openTab(`/${path}`, `Changes to ${fileName}`, "monaco-diff", null, originalModel);
        })

        // Add the filename to the container
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

        // Create the checkbox and type area
        const changeTypeAndCheckboxContainer = document.createElement("div");
        changeTypeAndCheckboxContainer.classList.add("stageArea");

        const changeTypeSpan = document.createElement("span");
        changeTypeSpan.classList.add(changeType);
        changeTypeSpan.innerText = changeType.substring(0, 1).toUpperCase();
        changeTypeAndCheckboxContainer.appendChild(changeTypeSpan);

        const stageCheckbox = document.createElement("input");
        stageCheckbox.type = "checkbox";

        // Set the checkbox state
        if (changeType === "staged" || changeType === "deleted") {
            stageCheckbox.checked = true;
        } else if (changeType === "staged_modified") {
            stageCheckbox.checked = true;
            stageCheckbox.indeterminate = true;
        }

        // Don't open the diff viewer if the checkbox is clicked
        stageCheckbox.addEventListener("click", (ev) => ev.stopPropagation())

        stageCheckbox.addEventListener("change", async () => {
            if (stageCheckbox.checked) {
                // If the change isn't staged, stage it
                if (changeType === "deleted_unstaged") {
                    await remove({ fs, dir: `/${dir}`, filepath: path });
                } else {
                    await add({ fs, dir: `/${dir}`, filepath: path });
                }
            } else {
                // Otherwise, unstage it
                await resetIndex({ fs, dir: `/${dir}`, filepath: path });
            }

            // Update the changes
            renderChanges();
        });

        changeTypeAndCheckboxContainer.appendChild(stageCheckbox);

        changeContainer.appendChild(changeTypeAndCheckboxContainer);

        changesElement.appendChild(changeContainer);
    });
}

/**
 * Launch the commit history tab
 */
async function openCommitHistory() {
    // Hide the sidebar if open
    toggleSidebar("right");

    // Open the tab
    await openTab("/gitcommithistory.mm", "Commit History", "custom", renderGraph);
}

/**
 * Rerender the commit history.
 */
function updateGraph() {
    requestReRender("/gitcommithistory.mm");
}

/**
 * Render the commit history tab. Called by tab manager, do not call manually.
 * @param {*} root The root element to append elements to
 */
async function renderGraph(root) {
    // Add the commit history title
    addHeading("Commit History", "h2", root);
    
    // Get the list of commits
    const gitLog = await log({ fs, dir: `/${dir}`});

    // Create the container for the commits
    const commitHistoryContainer = document.createElement("div");
    commitHistoryContainer.classList.add("commitHistory");
    
    for (const commit of gitLog) {
        // Find which files changed
        const oid = commit.oid;
        const parent = commit.commit.parent[0];

        let changes = [];

        if (!parent) {
            // If all of the files are new, just get the paths and say added
            changes = (await listFiles({
                fs,
                dir: `/${dir}`,
                ref: oid
            })).map(path => ({
                path,
                status: 'added',
            }));
        } else {
            // Walk through the changes
            changes = await walk({
                fs,
                dir: `/${dir}`, 
                trees: [TREE({ ref: parent }), TREE({ ref: oid })],
                map: async function (filepath, [A, B]) {
                    // If root, skip
                    if (filepath === '.') return

                    // Get the types
                    const aType = await A?.type();
                    const bType = await B?.type();

                    // If aType is not set, but bType is, then this file must have been added in this commit
                    if (!aType && bType) {
                        return { path: filepath, status: 'added' }
                    }
s
                    // If aType is set, but bType is not, then this file must have been deleted in this commit
                    if (aType && !bType) {
                        return { path: filepath, status: 'deleted' }
                    }
        
                    if (aType && bType) {
                        // If the file is present in the both this commit and the last commit
                        const aOid = await A.oid();
                        const bOid = await B.oid();

                        // And the file has changed, set to modified
                        if (aOid !== bOid) {
                            return { path: filepath, status: "modified" };
                        }
                    }

                    // Otherwise, skip
                    return undefined
                }
            });
        }
a
        // Only get non-undefined, non-null changes
        changes = changes.filter(Boolean);

        // Create a container for the commit
        const commitContainer = document.createElement("details");
        commitContainer.classList.add("commit");

        // Add the commit message and author
        const summary = document.createElement("summary");

        const messageSpan = document.createElement("span");
        messageSpan.classList.add("message");
        messageSpan.innerText = commit.commit.message.trim();
        summary.appendChild(messageSpan);

        const authorSpan = document.createElement("span");
        authorSpan.classList.add("author");
        authorSpan.innerText = commit.commit.author.name;
        summary.appendChild(authorSpan);

        commitContainer.appendChild(summary);

        // Add the file list
        changes.forEach(change => {
            // Seperate the name and directory
            const pathParts = change.path.split("/");
    
            const fileName = pathParts[pathParts.length - 1];
            const parentDir =
                pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

            // Create a new change container
            const changeContainer = document.createElement("div");
            changeContainer.classList.add("change");

            // Add the filename
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

            // Add the change type
            const changeTypeSpan = document.createElement("span");
            changeTypeSpan.classList.add(change.status);
            changeTypeSpan.innerText = change.status.substring(0, 1).toUpperCase();
    
            changeContainer.appendChild(changeTypeSpan);

            changeContainer.addEventListener("click", async (ev) => {
                // On click, read the old blob and the new blob
                const { blob } = await readBlob({
                  fs,
                  dir: `/${dir}`,
                  oid: parent,
                  filepath: change.path
                });

                const { blob: blob2 } = await readBlob({
                  fs,
                  dir: `/${dir}`,
                  oid: oid,
                  filepath: change.path
                });

                // Set the original and modified models to the values from this commit
                const originalContents = Buffer.from(blob).toString("utf8");
                originalModel.setValue(originalContents);

                const modifiedContents = Buffer.from(blob2).toString("utf8");
                modifiedModel.setValue(modifiedContents);

                // Open the diff editor, readonly
                openTab(`/${change.path}`, `Changes to ${fileName}`, "monaco-diff", null, originalModel, modifiedModel);
            })

            commitContainer.appendChild(changeContainer);
        });

        commitHistoryContainer.appendChild(commitContainer);
    }

    root.appendChild(commitHistoryContainer);
}

/**
 * Commit staged changes
 */
async function commitStaged() {
    // Get the commit message field and value
    const gitCommitMessage = document.getElementById("gitCommitMessage");
    let message = gitCommitMessage.value;
    if (message.trim().length === 0) {
        // If a message was not typed in the input field, use the command palette to request input
        message = await getInput(
            "Enter a commit message",
            "Enter a commit message",
        );

        if (message === undefined || message.trim().length === 0) {
            // If no input was provided here either, tell the user a message is required, and exit
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

    // Tell git to commit
    await commit({ fs, dir: `/${dir}`, message });

    // Reset the commit message input value
    gitCommitMessage.value = "";

    // Render changes and update commit history if open
    renderChanges();
    updateGraph();
}

/**
 * Downloads the `.git` folder for the active repo as a `.zip` file
 */
async function downloadGitAsZip() {
    // A JSZip instance
    const zip = new JSZip();

    // A recursive function that adds files to the zip
    async function addFilesToZip(path) {
        const folder = await fs.readdir(path);
        for (const filename of folder) {
            const types = await fs.stat(`${path}/${filename}`);
            const zipPath = path.replace(`/${dir}/.git`, "");
            if (types.type === "file") {
                // It's a file, so get the file and add it to the zip
                const fileContents = await fs.readFile(`${path}/${filename}`);
                zip.file(`${zipPath}/${filename}`, fileContents);
            } else {
                // It's a folder, so create the folder and call this function again
                zip.folder(`${zipPath}/${filename}`);
                await addFilesToZip(`${path}/${filename}`);
            }
        }
    }

    // Start the recursive function
    await addFilesToZip(`/${dir}/.git`);

    // Generate the zip as a blob
    const blob = await zip.generateAsync({ type: "blob" });
    
    // Create a blob:// url
    const url = URL.createObjectURL(blob);

    // Create a link element to download it and then click it
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${dir}-.git.zip`;
    a.click();
}

// FS Helper Functions

export async function fsMkDir(dirName, options) {
    if (!dirName.startsWith("/")) dirName = "/" + dirName;

    const fsResult = await fs.mkdir(`/${dir}${dirName}`, options);

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
