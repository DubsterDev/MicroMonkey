// Import the function to start the editor
import { setUpMonaco } from "./editor";

// Facilitates starting the serial connection with the board
import { getFiles, startSerial } from "./serial";

// For when we get the files from the board and to alllow creating new files
import { addNewFileEventListeners, newFolderStructure } from "./fileExplorer";

// For managing the open tabs
import { initializeOpenFilesManager, openTab, saveActiveFile } from "./openFilesManager";

// Mainly just for the context menu
import { renderWelcomeScreen, setupUiManager } from "./otherUiManager";

// Handles CTRL+SHIFT+P and running commands
import { setupCommandPalette } from "./commandPalette";
import { setupSettings } from "./settings";

// Insert the editor into the DOM
const editor = setUpMonaco();

// Start open files manager
initializeOpenFilesManager(editor);

// Setup settings
setupSettings();

// Create a Welcome to MicroMonkey tab
openTab("/.default_files/micromonkey/welcome.mm", "Welcome to MicroMonkey", "custom", renderWelcomeScreen);

// Begin listening for clicks on the Connect to board button
// and manage communication with it
startSerial(editor, async () => {
    // When connected to a board, get the files from it and tell file explorer
    newFolderStructure(await getFiles());
});

// When CTRL+S is pressed, save the active file
document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        saveActiveFile();
        return true;
    }
});

// Setup the context menu and command palette
setupUiManager();
setupCommandPalette();

// Add event listeners for creating new files and folders
addNewFileEventListeners();