// Import the openTab function to allow clicking on tabs
import { getInput } from "./commandPalette";
import { openTab } from "./openFilesManager";
import { createDirectory, createFile, getFiles } from "./serial";

/**
 * Re-renders the file explorer with a new folder structure.
 * Folder structure is in this format:
 * ```json
 * {
 *      "main.py": "main.py",
 *      "utils": {
 *          "cool_utility.py": "cool_utility.py"
 *      }
 * }
 * ```
 * @param {object} folderStructure The folder structure, as specified in the docs of this function.
 */
export function newFolderStructure(folderStructure) {
    // Deletes everything already in the file explorer
    document.querySelector(`[data-file-explorer-path="/"]`).innerText = "";

    // Start adding items
    recursivelyAddItems(folderStructure);
}

/**
 * Adds new file and folder event listeners.
 */
export function addNewFileEventListeners() {
    document.getElementById("newFileRoot").addEventListener("click", () => newFile("/"));
    document.getElementById("newFolderRoot").addEventListener("click", () => newFolder("/"));
}

/**
 * Launches the command palette with a request for a new file's name
 * and then creates the file if a name is provided.
 */
async function newFile(base="/") {
    if (!base.endsWith("/")) base = base + "/";
    // Get input from the command palette for a name
    const fileName = await getInput("Enter a name for the file");

    // If escaped or hit enter with no content, don't create the file
    if (fileName === undefined || fileName.trim() === "") return;

    // Use serial.js to create the file
    await createFile(`${base}${fileName}`);

    // Reload the file explorer
    newFolderStructure(await getFiles());
}

/**
 * Launches the command palette with a request for a new folder's name
 * and then creates the folder if a name is provided.
 */
async function newFolder(base="/") {
    if (!base.endsWith("/")) base = base + "/";
    // Get input from the command palette for a name
    const folderName = await getInput("Enter a name for the folder");

    // If escaped or hit enter with no content, don't create the folder
    if (folderName === undefined || folderName.trim() === "") return;

    // Use serial.js to create the folder
    await createDirectory(`${base}${folderName}`);

    // Reload the file explorer
    newFolderStructure(await getFiles());
}


/**
 * Adds items to the file explorer recursively.
 * @param {object} folderStructure The folder structure. See {@link newFolderStructure} for more information
 * @param {string} currentDir The base directory for this folder structure
 */
function recursivelyAddItems(folderStructure, currentDir="/") {
    // Get the keys of the folder structure, aka, the names of the folders and files
    const keys = Object.keys(folderStructure);

    // Sort the array of keys, folders first, and then by alphabetical ascending
    keys.sort((a, b) => {
        const aObject = folderStructure[a];
        const bObject = folderStructure[b];

        if (typeof aObject === "object" && typeof bObject !== "object") {
            return -1;
        } else if (typeof aObject !== "object" && typeof bObject === "object") {
            return 1;
        } else {
            return [a, b].sort()[0] == a ? -1 : 1;
        }
    });

    // Get the element that contains the base folder
    const parentElement = document.querySelector(`[data-file-explorer-path="${currentDir}"]`);

    // Loop through the sorted keys
    keys.forEach(key => {
        // Get the corresponding item
        const object = folderStructure[key];
        
        if (typeof object === "object") {
            // If it's a folder, create a container and assign classses
            const folderDiv = document.createElement("div");
            folderDiv.classList.add("folder-container");
            folderDiv.classList.add("item");

            // Create a paragraph tag to hold the name of the folder
            const folderName = document.createElement("p");

            // Put the name in the <p>
            folderName.innerText = key;

            // Add the folder-name class
            folderName.classList.add("folder-name");

            // When it's clicked, toggle the collapsed state of the folder's content
            folderName.addEventListener("click", () => folderDiv.classList.toggle("collapsed"));

            // Append the folder name to the main folder container
            folderDiv.appendChild(folderName);

            // Add current path to the folder container
            folderDiv.dataset.fileExplorerPath = `${currentDir}${key}/`;

            // Add it to the DOM
            parentElement.appendChild(folderDiv);

            // And keep going...
            recursivelyAddItems(object, `${currentDir}${key}/`);
        } else {
            // If it's a file, create a paragraph tag to hold the name
            const p = document.createElement("p");

            // Add the name
            p.innerText = key;
            p.dataset.fileName = key;

            // Add the file and item classes
            p.classList.add("file");
            p.classList.add("item");

            // When it's clicked tell openFilesManager.js to open the file
            p.addEventListener("click", () => {
                openTab(`${currentDir}${key}`);
            });

            // Add it to the DOM
            parentElement.appendChild(p);
        }
    })
}