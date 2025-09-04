// Used when renaming files, gets input using the command palette
import { getInput } from "./commandPalette";
import { addHeading, addParagraph } from "./customEditorHelperFunctions";

// After renaming, this is used to reload the file explorer
import { newFolderStructure } from "./fileExplorer";

// Helper functions for interacting with the board
import { getFiles, removeDirectoryRecursively, removeFile, renameFile } from "./serial";

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
            menuOptions.push(["Rename", () => {
                launchRename(currentDir);
            }]);

            // Add a delete action
            menuOptions.push(["Delete", async () => {
                // Tell the device to delete the file
                await removeDirectoryRecursively(`${currentDir}`);
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
            menuOptions.push(["Rename", () => {
                launchRename(currentDir, fileName);
            }]);

            // Add a delete action
            menuOptions.push(["Delete", async () => {
                // Tell the device to delete the file
                await removeFile(`${currentDir}${fileName}`);

                // Refresh the file explorer
                newFolderStructure(await getFiles());
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
}

/**
 * Rename a file or folder
 * @param {string} directory The directory that contains the file
 * @param {string} fileName The filename
 */
async function launchRename(directory="", fileName="") {
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
    const newName = await getInput("Enter a new name", fileName);

    // If no input was received, don't rename the file
    if (newName === undefined || newName.trim() === "") return;

    // Construct the old path and new path
    const oldPath = `${directory}${fileName}`;
    const newPath = `${directory}${newName}`;

    // Tell the device to rename the file and refresh the file explorer
    await renameFile(oldPath, newPath);
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
    addParagraph("This is a beta release, and there are many things yet to be done.", rootElement);
    addParagraph("It is mostly stable, so you should be able to download and put files on your device.", rootElement);
    addParagraph("Thanks for using MicroMonkey!", rootElement);
}