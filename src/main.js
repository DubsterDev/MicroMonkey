import "./style.css";
import { setUpMonaco } from "./editor";
import { getFiles, startSerial } from "./serial";
import { newFolderStructure } from "./fileExplorer";
const editor = setUpMonaco();

startSerial(editor, async () => newFolderStructure(await getFiles()));
