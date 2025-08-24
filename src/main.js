import "./style.css";
import { setUpMonaco } from "./editor";
import { getFiles, startSerial } from "./serial";
import { newFolderStructure } from "./fileExplorer";
import { initializeOpenFilesManager, saveActiveFile } from "./openFilesManager";
const editor = setUpMonaco();
initializeOpenFilesManager(editor);

startSerial(editor, async () => {
    newFolderStructure(await getFiles());
});

document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        saveActiveFile();
        return true;
    }
});

const menu = document.getElementById("contextMenu");
document.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    const menuOptions = [];
    if (ev.target.classList.contains("folder-name")) {
        const currentDir = ev.target.parentElement.dataset.fileExplorerPath;
        console.log(currentDir);
        menuOptions.push(["Rename", () => {
            
        }]);
    } else if (ev.target.classList.contains("file")) {
        const currentDir = ev.target.parentElement.dataset.fileExplorerPath;
        const fileName = ev.target.innerText;
        console.log(currentDir, fileName);
        menuOptions.push(["Rename", () => {

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