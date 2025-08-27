import { openTab } from "./openFilesManager";

export function newFolderStructure(folderStructure) {
    document.querySelector(`[data-file-explorer-path="/"]`).innerText = "";
    recursivelyAddItems(folderStructure);
}

function recursivelyAddItems(folderStructure, currentDir="/") {
    const keys = Object.keys(folderStructure);
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

    const parentElement = document.querySelector(`[data-file-explorer-path="${currentDir}"]`);
    keys.forEach(key => {
        const object = folderStructure[key];
        
        if (typeof object === "object") {
            const folderDiv = document.createElement("div");
            folderDiv.classList.add("folder-container");
            folderDiv.classList.add("item");

            const folderName = document.createElement("p");
            folderName.innerText = key;
            folderName.classList.add("folder-name");
            folderName.addEventListener("click", () => folderDiv.classList.toggle("collapsed"))

            folderDiv.dataset.fileExplorerPath = `${currentDir}${key}/`;
            folderDiv.appendChild(folderName);
            parentElement.appendChild(folderDiv);
            recursivelyAddItems(object, `${currentDir}${key}/`);
        } else {
            const p = document.createElement("p");

            const span = document.createElement("span");
            span.innerText = key;
            p.appendChild(span);

            p.dataset.fullPath = `${currentDir}${key}`;
            p.dataset.fileName = key;
            p.classList.add("file");
            p.classList.add("item");
            p.addEventListener("click", () => {
                openTab(`${currentDir}${key}`);
            })
            parentElement.appendChild(p);
        }
    })
}