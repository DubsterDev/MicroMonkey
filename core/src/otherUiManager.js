// Used when renaming files, gets input using the command palette
import { addCommand, getInput } from "./commandPalette";
import { MICROMONKEY_VERSION } from "./constants";
import { addHeading, addParagraph } from "./customEditorHelperFunctions";

// After renaming, this is used to reload the file explorer
import { newFolderStructure } from "./fileExplorer";
import { closeSavedTabs, closeTab, closeTabsInDirectory, openTab, renameTab, renameTabsInDirectory } from "./openFilesManager";

// Helper functions for interacting with the board
import { getAllFilesAsZip, getFiles, removeDirectoryRecursively, removeFile, renameFile, uploadAllFilesFromZip } from "./serial";

// Get the context menu element
const menu = document.getElementById("contextMenu");

/**
 * Adds event listeners for handling context menu actions
 */
export function setupUiManager() {
    // Event listener for right click
    document.addEventListener("contextmenu", (ev) => {
        // Prevent the default context menu from showing up
        ev.preventDefault();

        // An array of menu options, in format [Name, Click-Listener]
        const menuOptions = [];

        if (ev.target.classList.contains("folder-name") || ev.target.parentElement.classList.contains("folder-name")) {
            // If it's a folder that's clicked
            // Get the directory's path
            const currentDir = ev.target.classList.contains("folder-name") ? ev.target.parentElement.dataset.fileExplorerPath : ev.target.parentElement.parentElement.dataset.fileExplorerPath;

            // Add a rename function that launches a rename
            menuOptions.push(["Rename", (ev) => {
                ev.stopPropagation();
                launchRename(currentDir);
            }]);

            // Add a delete action
            menuOptions.push(["Delete", async () => {
                // Tell the device to delete the file
                await removeDirectoryRecursively(`${currentDir}`);
                
                // Close all tabs in this directory
                closeTabsInDirectory(`${currentDir}`);
                
                // And refresh the file explorer
                newFolderStructure(await getFiles());
            }]);
        } else if (ev.target.classList.contains("file")) {
            // If it's a file that's clicked
            // Get the directory path
            const currentDir = ev.target.parentElement.dataset.fileExplorerPath;

            // And the file name
            const fileName = ev.target.dataset.fileName;

            // Add a rename action that launches a rename
            menuOptions.push(["Rename", (ev) => {
                ev.stopPropagation();
                launchRename(currentDir, fileName);
            }]);

            // Add a delete action
            menuOptions.push(["Delete", async () => {
                // Tell the device to delete the file
                await removeFile(`${currentDir}${fileName}`);
                closeTab(`${currentDir}${fileName}`);

                // Refresh the file explorer
                newFolderStructure(await getFiles());
            }]);
        } else if (ev.target.classList.contains("tab") || ev.target.parentElement.classList.contains("tab")) {
            menuOptions.push(["Close Tab", () => {
                // Get the path of the tab
                const path = ev.target.classList.contains("tab") ? ev.target.dataset.path : ev.target.parentElement.dataset.path;

                // Close the tab
                closeTab(path);
            }]);
            menuOptions.push(["Close Saved Tabs", () => {
                closeSavedTabs();
            }]);
            menuOptions.push(["Close All Tabs", () => {
                closeTabsInDirectory("/");
            }]);
        } else {
            // Add a item that does nothing if no other branch matches
            menuOptions.push(["Nothing to see here", () => {}]);
        }

        // Clear the menu
        menu.innerText = "";

        // Add the options
        menuOptions.forEach(option => {
            // Create an option element and add the class
            const optEl = document.createElement("p");
            optEl.classList.add("option");

            // Add the name of the option
            optEl.innerText = option[0];

            // Add an event listener
            optEl.addEventListener("click", option[1]);

            // Add it to the menu
            menu.appendChild(optEl);
        });

        // Display the menu at where the right click was
        menu.style.display = "block";
        menu.style.left = ev.pageX + "px";
        menu.style.top = ev.pageY + "px";
        return true;
    });

    // Add an event listener that closes the menu on click anywhere
    document.addEventListener("click", () => {
        menu.style.display = "none";
    });

    // Add an option to the Command Palette to download all files as a ZIP
    addCommand("downloadAllFiles", "Download All Files as ZIP [BETA]", downloadAllFiles);

    // Add an option to the Command Palette to upload and overwrite all files as a ZIP
    addCommand("uploadAllFiles", "Upload All Files from a ZIP [BETA]", uploadAllFiles);
}

/**
 * Rename a file or folder
 * @param {string} directory The directory that contains the file
 * @param {string} fileName The filename
 */
async function launchRename(directory="", fileName="") {
    // Whether the directory originally ended with a slash
    const wasDirectory = directory.endsWith("/");

    // If no fileName is provided, use the last part
    if (fileName === "") {
        // If the directory ends with /, remove the slash
        if (directory.endsWith("/")) directory = directory.slice(0, directory.length - 1);

        // Split the directory into segments
        const directories = directory.split("/");

        // Set the filename to the last piece
        fileName = directories.pop();

        // Rejoin the directories without the last piece
        directory = directories.join("/");
    }

    // If the directory doesn't end with a slash, add one
    if (!directory?.endsWith("/")) directory = (directory || "")  + '/';
    
    // Get a new name for the file or folder from the command palette
    const newName = await getInput("Enter a new name", "Enter a new name", fileName);

    // If no input was received, don't rename the file
    if (newName === undefined || newName.trim() === "") return;

    // Construct the old path and new path
    const oldPath = `${directory}${fileName}`;
    const newPath = `${directory}${newName}`;

    // Tell the device to rename the file
    await renameFile(oldPath, newPath);

    // Rename any open tabs
    if (wasDirectory) {
        renameTabsInDirectory(`${oldPath}/`, `${newPath}/`);
    } else {
        renameTab(oldPath, newPath);
    }

    // Refresh the file explorer
    newFolderStructure(await getFiles());
}

// Other random functions that didn't have a better spot

/**
 * Renders the welcome screen on a custom tab
 * @param {Element} rootElement The element to append the welcome screen to
 */
export async function renderWelcomeScreen(rootElement) {
    // Header
    addHeading("Welcome to MicroMonkey!", "h2", rootElement);

    // Define some welcome text
    addParagraph("Connect your device with a USB cable, and then you can use the Connect to Board button on the bottom left.", rootElement);
    addParagraph("If the device does not load, try pressing the 'EN' button on the board or refreshing the page.", rootElement);
    addParagraph("To soft-reboot device, click into the serial monitor and use the keyboard shortcut CTRL+D.", rootElement);
    addParagraph("For more information about controlling your board with the serial monitor, run help()", rootElement);
}

/**
 * Renders the what's new screen on a custom tab
 * This is shown when the version changes, and should be updated with each release
 * @param {Element} rootElement The element to use as root
 */
export async function renderWhatsNewScreen(rootElement) {
    // Header
    addHeading(`What's New in MicroMonkey ${MICROMONKEY_VERSION}`, "h2", rootElement);

    // Define some what's new text
    // This should be updated with each release, so check the changelog for what to put here.
    // It doesn't have to have everything the CHANGELOG has, just the most important stuff.
    addHeading("Fixed", "h3", rootElement);
    addParagraph("- Rename action didn't launch rename action", rootElement);
    addParagraph("- Editor going off screen slightly", rootElement);
}

export function startWhatsNewScreenIfVersionChanged() {
    // Get the last version from local storage
    const lastVersion = localStorage.getItem("micromonkey-version");

    // If the version has changed, open the What's New tab
    if (lastVersion !== null && lastVersion !== undefined && lastVersion !== MICROMONKEY_VERSION) {
        openWhatsNewTab();
    }

    // Update the MicroMonkey version in local storage
    localStorage.setItem("micromonkey-version", MICROMONKEY_VERSION);

    // Add an option to the Command Palette to view the What's New screen again
    addCommand("openWhatsNew", "What's New", openWhatsNewTab);
}

/**
 * Opens the What's New tab
 */
function openWhatsNewTab() {
    openTab("/.default_files/micromonkey/whats_new.mm", "What's New", "custom", renderWhatsNewScreen);
}

/**
 * Generates and downloads a ZIP file of the current board files
 */
async function downloadAllFiles() {
    // Get a zip blob
    const blob = await getAllFilesAsZip();

    // Create a blob:// url
    const url = URL.createObjectURL(blob);

    // Create a link element to download it and then click it
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "files.zip";
    a.click();
}

/**
 * Initiates an upload of a zip file to overwrite contents on the board.
 */
async function uploadAllFiles() {
    // Options the user can pick
    const DELETE = "Delete all files from the board and write the new ones";
    const OVERWRITE = "Overwrite any files with the same names as those in the ZIP";
    const CANCEL = "Cancel";

    // Ask the user whether they want to proceed
    const whatToDo = await getInput("What would you like to do?", "", "", [DELETE, OVERWRITE, CANCEL], false);

    // If the user said no, break out of the function
    if (whatToDo === CANCEL || whatToDo === undefined) {
        return;
    }

    // Create a file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    
    // Add a onchange listener
    input.addEventListener("change", () => {
        // Exit early if no file is selected
        if (input.files[0] === null) return;

        // Create a new FileReader to read the file
        const reader = new FileReader();

        reader.onload = async (ev) => {
            // When the zip is loaded, continue.
            await uploadAllFilesFromZip(ev.target.result, whatToDo === DELETE);

            // Reload the file explorer
            newFolderStructure(await getFiles());
        }

        // Read the zip as an array buffer
        reader.readAsArrayBuffer(input.files[0])
    });

    // Launch the input
    input.click();

}