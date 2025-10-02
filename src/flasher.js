// Import necessary functions and modules
import { openTab, requestReRender } from "./openFilesManager";
import { addButton, addHeading, addMessageBox, addParagraph } from "./customEditorHelperFunctions";
import { addCommand, getInput } from "./commandPalette";
import { disconnectSerialPort, getPort } from "./serial";
import { flashESP } from "./espFlasher";

// Define the board type, defined later when selected by user
let boardType = null;

// The file path used for the tab
const myFilePath = "/.default_files/micromonkey/flasher.mm";

// Variables to track flashing progress
let flashingTotal = 0;
let flashingAmountDone = 0;

// Create a hidden file input element for firmware upload
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".bin";
fileInput.onchange = () => requestReRender(myFilePath);

/**
 * Add event listeners for flasher functionality, such as the button on the bottom right of the IDE and the command in the command palette.
 */
export function addFlasherEventListeners() {
    // Add an event listener to the button on the bottom right of the IDE
    // document.getElementById("flashMicroPython").addEventListener("click", openFlasher)

    // Add a command to the command palette
    addCommand("openMicroPythonFlasher", "Flash MicroPython", openFlasher);
}

// The stage of flashing, used to determine what to show the user
let flashingStage = "not_started";

/**
 * Begin the flashing process after the user has selected a file and connected to a device.
 */
async function beginFlash() {
    // Disconnect the serial port from serial.js
    await disconnectSerialPort();

    // Get the serial port from serial.js
    const device = getPort();

    if (boardType === "espressif") {
        // If the board type is an espressif device, flash it using the espFlasher.js module
        // Passing the serial port, function to update the flashing stage,
        // a function to update the flashing progress, and the file to flash
        flashESP(device, (stage) => {
            flashingStage = stage;
            requestReRender(myFilePath);
        }, (total, done) => {
            flashingTotal = total;
            flashingAmountDone = done;
            requestReRender(myFilePath);
        }, fileInput.files[0]);
    } 
}

/**
 * Opens the flasher tab after asking the user what type of board they are trying to flash.
 */
async function openFlasher() {
    // Get what type of board the user is trying to flash
    const flasherType = await getInput("What type of board are you trying to flash?", "Filter results", "", ["ESP32 or ESP8266", "Cancel"], false);

    // If the user cancels, do nothing
    if (flasherType === "Cancel") {
        return;
    }

    if (flasherType === "ESP32 or ESP8266") {
        // If the user is trying to flash an ESP32 or ESP8266, set the board type to espressif
        boardType = "espressif";
    } else {
        // If there is no valid selection, do nothing
        return;
    }

    // Open the flasher tab
    openTab(myFilePath, "MicroPython Flasher", "custom", renderFlasherPage);
}

/**
 * Renders the flasher page based on the current flashing stage.
 * @param {Element} root The element to render the flasher page into
 */
function renderFlasherPage(root) {
    // Add the heading
    addHeading("MicroPython Flasher", "h2", root);

    if (flashingStage === "not_started") {
        // If the flashing process has not started, show the user the file input and instructions
        if (boardType === "espressif") {
            // A warning message to ensure the user is using the right type of device
            addMessageBox("warning", "This flasher is for flashing Espressif devices, such as the ESP32 or ESP8266. If this is not the right type of device, reopen the flasher", root);
        }

        // The file input for the user to upload the firmware
        addParagraph(fileInput.files.length > 0 ? "Firmware selected" : "You must upload the firmware to flash.", root);
        addButton(fileInput.files.length > 0 ? "Change" : "Upload", root, () => fileInput.click())

        // Explanatory text and button to begin the flashing process
        addParagraph("Connect to a board with the button on the bottom left, then press continue.", root);
        addParagraph("Press and hold the Boot button on your board while pressing the continue button.", root);

        /// The button to begin the flashing process
        addButton("Continue", root, beginFlash);
    } else if (flashingStage === "getting_ready") {
        // If the flashing process is getting ready, show a message
        addParagraph("Getting ready to flash MicroPython...", root);
    } else if (flashingStage === "flashing") {
        // If the flashing process is in progress, show a message and a progress bar
        addParagraph("Flashing MicroPython...", root);

        // The progress bar showing the flashing progress
        const percentHolder = document.createElement("progress");
        percentHolder.max = flashingTotal;
        percentHolder.value = flashingAmountDone;
        root.appendChild(percentHolder);
    } else if (flashingStage === "done") {
        // If the flashing process is done, show a message and a button to refresh the IDE
        addParagraph("Done flashing.", root);
        addParagraph("Reboot your device by pressing the EN button.", root);
        addParagraph("Then, refresh MicroMonkey and reconnect.", root);
        addButton("Refresh MicroMonkey", root, () => location.reload());
    }
}