import "./style.css";
import { setUpMonaco } from "./editor";
import { getFiles, startSerial } from "./serial";
import { newFolderStructure } from "./fileExplorer";
const editor = setUpMonaco();

newFolderStructure({
    "main.py": "main.py",
    "bob.py": "bob.py",
    "fred.py": "fred.py",
    "chatter2": {
        "chat.py": "chat.py",
        "libs": {
            "get_french_fries.py": "get_french_fires.py"
        }
    }
})
startSerial(editor, async () => newFolderStructure(await getFiles()));
