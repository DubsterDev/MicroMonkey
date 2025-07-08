export function newFolderStructure(folderStructure) {
    recursivelyAddItems(folderStructure);
}

function addItems(folderStructure) {
    while (true) {

    }
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
            const folderDiv = document.createElement("p");
            folderDiv.innerText = "[FOLDER] " + key;
            folderDiv.dataset.fileExplorerPath = `${currentDir}${key}/`;
            folderDiv.classList.add("folder");
            parentElement.appendChild(folderDiv);
            recursivelyAddItems(object, `${currentDir}${key}/`);
        } else {
            const p = document.createElement("p");
            p.innerText = "[FILE] " + key;
            p.classList.add("file");
            parentElement.appendChild(p);
        }
    })
}