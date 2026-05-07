// Import functions from editor to change what is showing
import { getInput } from "./commandPalette";
import { changeModel, createModel } from "./editor";
import { fsEmptyDir, fsMkDir, fsWriteFile } from "./git";

// Functions to get files from the serial device and write files
import { getFile, getFiles, writeFile } from "./serial";
import { closeFile, openFile } from "./tyManager";

// An object containing the open tabs
const tabs = {};

// References to monaco and custom editor in the DOM
const codeEditorElement = document.getElementById("codeEditor");
const codeDiffEditorElement = document.getElementById("codeDiffEditor");
const customEditorElement = document.getElementById("customEditor");
const serialMonitor = document.getElementById("serialMonitor");
const rightPanel = document.getElementById("rightPanel");
const saveButton = document.getElementById("saveFile");

// Map the save button to the save function
saveButton.addEventListener("click", saveActiveFile);

/**
 * Renders the tabs for the first time.
 */
export function initializeOpenFilesManager() {
    renderTabs();
}

/**
 * Opens or focuses a tab
 * @param {string} path The path of the file on the board
 * @param {string} title A name to be shown on the tab. If no name is provided, the last segment of the path is used
 * @param {string} type The type of editor to be shown. Either `monaco` (meaning content is fetched from board and displayed in a Monaco editor), `monaco-diff` (modified content is fetched from board, must provide original model) or `custom` (must provide render function)
 * @param {Function|null} renderFunction If the passed type is `custom`, this parameter must have a function that receives a root element where you can append new elements to. It will be called whenever the tab is clicked
 * @param {*} [originalModel=null] If the passed type is `monaco-diff`, this parameter must have a model that will be displayed side by side with the modified file.
 */
export async function openTab(
    path,
    title = "",
    type = "monaco",
    renderFunction = null,
    originalModel = null
) {
    // Change the path used everywhere else if it's a monaco-diff
    const boardPath = path;
    if (type === "monaco-diff") {
        path = "/fileatgithead.mm";
    }
    
    // Check if this tab is opened already, while deactivating the currently active tab
    Object.keys(tabs).forEach((path) => {
        const tab = tabs[path];
        
        if (tab.active) {
            tab.active = false;
        }
    });
    if (path in tabs && type !== "monaco-diff") {
        // If the tab is already opened, activate it
        tabs[path].active = true;
    } else {
        // If the type is monaco, grab the contents from the board and create a model for it
        let model;
        if (type === "monaco") {
            // Get the file's content from the board
            const content = await getFileAndSave(boardPath);

            // A list of file extensions and their corresponding languages in Monaco
            const languages = {
                py: "python",
                json: "json",
                md: "markdown",
                js: "javascript",
                html: "html",
                css: "css",
            };

            // Split the file path by .
            const segments = path.split(".");

            // Get the last segment, which is the file extension, and look up the language
            const language =
                languages[segments[segments.length - 1]] ?? "plaintext";

            // Create a monaco model for the file
            model = createModel(content, "file://micromonkey" + path, language);
        } else if (type === "monaco-diff") {
            model = tabs[boardPath].model;
        }

        // Add the tab to the list of tabs
        tabs[path] = {
            title: title === "" ? path.split("/").at(-1) : title,
            type: type,
            model: model,
            originalModel: originalModel,
            renderFunction: renderFunction,
            active: true,
            saved: true,
        };
    }

    // Render the tabs
    renderTabs();
}

/**
 * Used to change the tab to indicate it is unsaved
 * @param {string} path The path of the file that was changed
 */
export function fileChanged(path) {
    // Decode the path
    path = decodeURIComponent(path);

    // If it already is unsaved, don't do anything
    if (!tabs[path].saved) return;

    // Mark the file as unsaved and render the tabs
    tabs[path].saved = false;
    renderTabs();
}

/**
 * Write the active file's content to the connected device
 */
export function saveActiveFile() {
    // Loop through the paths of open tabs
    Object.keys(tabs).forEach(async (path) => {
        // Get the tab object
        const tab = tabs[path];
        if (tab.active && tab.type === "monaco") {
            // Get the new contents
            const contents = tab.model.getValue();

            // If this is an active tab, and it is a file, write the file to the board
            await writeFile(contents, path);

            // Mark it as saved
            tab.saved = true;

            // Update the cache
            await fsWriteFile(path, contents);

            // And render the tabs
            renderTabs();
        }
    });
}

/**
 * Renames a tab
 * @param {string} oldPath The current path of the file
 * @param {string} newPath The new path of the file
 * @param {boolean} skipRender Whether or not to skip rendering the tabs again, defaults to false
 */
export async function renameTab(oldPath, newPath, skipRender = false) {
    // Get the tab
    const tab = tabs[oldPath];

    // If the tab doesn't exist, return
    if (tab === undefined || tab === null) return;

    // Delete the old tab
    delete tabs[oldPath];

    // Change the title to the last segment of the new path
    const newTitle = newPath.split("/").at(-1);

    // Set the tab in the list of tabs with the new path and title
    tabs[newPath] = tab;
    tabs[newPath].title = newTitle;

    // Render the tabs
    if (!skipRender) renderTabs();
}

/**
 * Rename all tabs that are in a directory from the tab strip
 * @param {string} oldPath The file path to rename everything under, should end with a /
 * @param {string} newPath The file path to rename everything under to, should end with a /
 */
export async function renameTabsInDirectory(oldPath, newPath) {
    // Loop through all the tabs
    Object.keys(tabs).forEach(async (tabPath) => {
        // And rename a tab if the path starts with the provided path
        if (tabPath.startsWith(oldPath))
            await renameTab(tabPath, tabPath.replace(oldPath, newPath), true);
    });

    // Render the tabs after all renaming is done
    await renderTabs();
}

/**
 * Remove a tab from the tab strip if it's open
 * @param {string} path The file path
 * @param {boolean} force Forces the tab to close even if unsaved. Default is false
 */
export async function closeTab(path, force = false) {
    // Get the tab object
    const tab = tabs[path];

    // Return if the tab isn't open
    if (tab === undefined || tab === null) return;

    // If the tab is unsaved, confirm with the user
    if (!tab.saved && !force) {
        const result = await getInput(
            `${tab.title} isn't saved. Are you sure you want to close it?`,
            "Pick an option",
            "",
            ["No", "Yes"],
            false,
        );
        if (result !== "Yes") return;
    }

    // Dispose of the model, if it is monaco
    if (tab.type === "monaco") tab.model.dispose();
    // Or, if it's a custom editor, remove content from the custom editor
    else if (tab.type === "custom") customEditorElement.innerText = "";

    // Delete the tab from the list of tabs
    delete tabs[path];

    // If this was an active tab, activate the last tab if possible
    const tabKeys = Object.keys(tabs);
    if (tab.active && tabKeys.length > 0)
        tabs[tabKeys[tabKeys.length - 1]].active = true;

    // Render the tabs
    renderTabs();
}

/**
 * Remove all tabs that are in a directory from the tab strip
 * @param {string} path The file path to remove everything under, should end with a /
 * @param force Forces tabs to close even if unsaved. Default is false
 */
export function closeTabsInDirectory(path, force = false) {
    // Loop through all the tabs
    Object.keys(tabs).forEach((tabPath) => {
        // And close a tab if the path starts with the provided path
        if (tabPath.startsWith(path)) closeTab(tabPath, force);
    });
}

/**
 * Closes the active tab
 * @param {boolean} force Forces the tab to close even if unsaved. Default is false
 */
export function closeActiveTab(force = false) {
    Object.keys(tabs).forEach((path) => {
        const tab = tabs[path];
        if (tab.active) {
            closeTab(path, force);
        }
    });
}

/**
 * Request the render function be called again, only works if the tab is active and it is a custom tab
 * @param {string} path The file path of the custom editor that wants to be rendered
 */
export function requestReRender(path) {
    // Get the tab
    const tab = tabs[path];

    // If the tab doesn't exist, return
    if (tab === null || tab === undefined) return;

    // If the tab is a custom editor, and it is active, render it again
    if (tab.active && tab.type === "custom") {
        customEditorElement.innerText = "";
        tab.renderFunction(customEditorElement);
    }
}

/**
 * Renders the tabs in the tab strip and optionally activates the active tab's model in Monaco or calls the render function
 * @param {boolean} activateActiveTab Whether or not to change the model open in Monaco or show call the custom render function
 */
function renderTabs(activateActiveTab = true) {
    // Get and clear the tabs container
    const tabsContainer = document.getElementById("tabs");
    tabsContainer.innerText = "";

    // Hide the save button
    saveButton.style.display = "none";

    // Loop through the paths of the tabs
    const tabPaths = Object.keys(tabs);
    tabPaths.forEach((path) => {
        // Get the tab's object
        const tab = tabs[path];

        // Create a container for the tab
        const tabContainer = document.createElement("div");

        // Add the tab class and set the path data field
        tabContainer.dataset.path = path;
        tabContainer.classList.add("tab");

        // If it's active, add the active class
        if (tab.active) {
            tabContainer.classList.add("active");
        }

        // Create a <p> element to hold the name of the tab
        const tabTitle = document.createElement("p");

        // Set the innerText to the tab's title, and, if it is unsaved, add (unsaved) as well
        tabTitle.innerText = tab.title + (tab.saved ? "" : " (unsaved)");

        // Add the tab title to the tab container
        tabContainer.appendChild(tabTitle);

        // Create a close button
        const closeBtn = document.createElement("button");

        // Add the material symbols class
        closeBtn.classList.add("material-symbols-outlined");

        // Set the icon to close
        closeBtn.innerText = "close";

        // And add it to the tab container
        tabContainer.appendChild(closeBtn);

        closeBtn.addEventListener("click", async (ev) => {
            // Prevent the tab container's click event from being triggered
            ev.stopPropagation();

            // Close the tab
            closeTab(path);
        });

        // When the tab is clicked, set it as active
        tabContainer.addEventListener("click", () => {
            // Loop through the tab paths
            Object.keys(tabs).forEach((aTabPath) => {
                // Get the tab object
                const aTab = tabs[aTabPath];

                // If it's active, deactivate it
                if (aTab.active) {
                    aTab.active = false;
                }
            });

            // Set this tab as active
            tab.active = true;

            // And re-render the tabs
            renderTabs();
        });

        // Add the tab to the tab container
        tabsContainer.appendChild(tabContainer);

        // If activateActiveTab is set to true, and this tab is active,
        // change the model or switch to custom editor mode
        if (activateActiveTab && tab.active && tab.type === "monaco") {
            codeEditorElement.style.display = "block";
            codeDiffEditorElement.style.display = "none";
            customEditorElement.style.display = "none";

            // Show the save button
            saveButton.style.display = "flex";

            changeModel(tab.model);
        } else if (activateActiveTab && tab.active && tab.type === "monaco-diff") {
            codeEditorElement.style.display = "none";
            codeDiffEditorElement.style.display = "block";
            customEditorElement.style.display = "none";

            changeModel(tab.model, tab.originalModel);
        } else if (activateActiveTab && tab.active && tab.type === "custom") {
            codeEditorElement.style.display = "none";
            codeDiffEditorElement.style.display = "none";
            customEditorElement.style.display = "block";
            customEditorElement.innerText = "";
            tab.renderFunction(customEditorElement);
        }
    });

    // Scroll the active tab into view
    const activeTab = document.querySelector(".tabs .tab.active");
    if (
        activeTab !== null &&
        activeTab !== undefined &&
        !isInViewport(activeTab)
    )
        activeTab?.scrollIntoView({
            behavior: "instant",
            block: "nearest",
            inline: "nearest",
        });

    // If there are no tabs, set the custom editor to visible to get the monkey to appear
    if (tabPaths.length === 0) {
        codeEditorElement.style.display = "none";
        customEditorElement.style.display = "block";
    }
}

/**
 * Gets the contents of a file from the board and store it in the FS.
 * @param {string} path The path of the file to retrieve
 * @returns {string} The contents of the file
 */
export async function getFileAndSave(path) {
    // Get the contents from the board
    const fileContents = await getFile(path);

    // Save it to fs
    fsWriteFile(path, fileContents);

    // Open it in Ty
    await openFile("file://micromonkey" + path, fileContents);

    // Return the file contents
    return fileContents;
}

/**
 * Loads all the files on the board into the FS.
 */
export async function addAllFilesToFS() {
    // Get the list of files from the board
    const files = await getFiles();

    async function addFolderToFS(folder, path) {
        try {
            await fsMkDir(path);
        } catch {
            // it may already exist
        }
        for (const key in folder) {
            if (typeof folder[key] === "string") {
                // If it's a string, it's a file, so get the file and add it to the cache
                await getFileAndSave(path + "/" + folder[key]);
            } else {
                // If it's not a string, it's a folder, so call this function again
                await addFolderToFS(folder[key], path + "/" + key);
            }
        }
    }

    // Delete current cache
    await fsEmptyDir();
    // Start the recursive function to get files
    await addFolderToFS(files, "");
}

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
            (window.innerWidth || document.documentElement.clientWidth)
    );
}
