import { newFolderStructure } from "./fileExplorer";
import { getFiles, renameFile } from "./serial";

const menu = document.getElementById("contextMenu");
export function setupUiManager() {
    document.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const menuOptions = [];
        if (ev.target.classList.contains("folder-name")) {
            const currentDir = ev.target.parentElement.dataset.fileExplorerPath;
            console.log(currentDir);
            menuOptions.push(["Rename", () => {

            }]);
        } else if (ev.target.classList.contains("file") || ev.target.parentElement?.classList.contains("file")) {
            const currentDir = ev.target.parentElement.dataset.fileExplorerPath || ev.target.parentElement.parentElement.dataset.fileExplorerPath;
            const fileName = ev.target.classList.contains("file") ? ev.target.dataset.fileName : ev.target.parentElement.dataset.fileName;
            console.log(currentDir, fileName);
            menuOptions.push(["Rename", () => {
                launchRename(currentDir, fileName);
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
        // const renameInput = document.querySelector(".renameInput");
        // if (renameInput && renameInput.previousElementSibling) renameInput.previousElementSibling.style.display = "initial";
        // if (renameInput) renameInput.outerHTML = "";
    });
}

function launchRename(directory="", fileName="") {
    if (!directory?.endsWith("/")) directory = (directory || "")  + '/';
    const element = document.querySelector(`[data-full-path="${directory || ""}${fileName || ""}"]`)
    
    const title = element.querySelector("span");
    title.style.display = "none";
    
    const renameInput = document.createElement("input");
    renameInput.classList.add("renameInput");
    renameInput.value = fileName;
    element.appendChild(renameInput);
    renameInput.focus();
    renameInput.addEventListener("click", (ev) => {
        ev.stopPropagation();
    });

    renameInput.addEventListener("keydown", async (ev) => {
        if (ev.code.toLowerCase() === "enter") {
            title.style.display = "initial";
            renameInput.outerHTML = "";

            const newName = renameInput.value;
            const oldPath = `${directory}${fileName}`;
            const newPath = `${directory}${newName}`;

            title.innerText = `${newName} (pending)`;
            element.dataset.fullPath = newPath;
            element.dataset.fileName = newName;

            await renameFile(oldPath, newPath);
            newFolderStructure(await getFiles());
        }
    })
}