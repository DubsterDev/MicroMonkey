import "./style.css";
import { setUpMonaco } from "./editor";
import { getFiles, startSerial } from "./serial";
import { newFolderStructure } from "./fileExplorer";
import { initializeOpenFilesManager, saveActiveFile } from "./openFilesManager";
const editor = setUpMonaco();
initializeOpenFilesManager(editor);

startSerial(editor, async () => newFolderStructure(await getFiles()));

document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        saveActiveFile();
        return true;
    }
})