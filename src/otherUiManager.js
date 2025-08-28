import { getInput } from "./commandPalette";
import { newFolderStructure } from "./fileExplorer";
import { getFiles, removeDirectory, removeFile, renameFile } from "./serial";

const menu = document.getElementById("contextMenu");
export function setupUiManager() {
    document.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const menuOptions = [];
        if (ev.target.classList.contains("folder-name")) {
            const currentDir = ev.target.parentElement.dataset.fileExplorerPath;
            menuOptions.push(["Rename", () => {
                launchRename(currentDir);
            }]);
            menuOptions.push(["Delete", async () => {
                await removeDirectory(`${currentDir}`);
                newFolderStructure(await getFiles());
            }]);
        } else if (ev.target.classList.contains("file")) {
            const currentDir = ev.target.parentElement.dataset.fileExplorerPath;
            const fileName = ev.target.dataset.fileName;
            
            menuOptions.push(["Rename", () => {
                launchRename(currentDir, fileName);
            }]);
            menuOptions.push(["Delete", async () => {
                await removeFile(`${currentDir}${fileName}`);
                newFolderStructure(await getFiles());
            }]);
        } else {
            menuOptions.push(["Nothing to see here", () => {

            }]);
        }

        menu.innerText = "";
        menuOptions.forEach(option => {
            const optEl = document.createElement("p");
            optEl.classList.add("option");
            optEl.innerText = option[0];
            optEl.addEventListener("click", option[1]);
            menu.appendChild(optEl);
        });
        menu.style.display = "block";
        menu.style.left = ev.pageX + "px";
        menu.style.top = ev.pageY + "px";
        return true;
    });

    document.addEventListener("click", () => {
        menu.style.display = "none";
    });
}

async function launchRename(directory="", fileName="") {
    if (fileName === "") {
        if (directory.endsWith("/")) directory = directory.slice(0, directory.length - 1);
        const directories = directory.split("/");
        fileName = directories.pop();
        directory = directories.join("/");
    }
    if (!directory?.endsWith("/")) directory = (directory || "")  + '/';
    
    const newName = await getInput("Enter a new name", fileName);

    const oldPath = `${directory}${fileName}`;
    const newPath = `${directory}${newName}`;

    await renameFile(oldPath, newPath);
    newFolderStructure(await getFiles());
}