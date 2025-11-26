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
    try {
        await disconnectSerialPort();
    } catch (e) {
        console.error("Error disconnecting serial port:", e);
        // Even if there is an error disconnecting, we can still try to flash. It may have been disconnected already.
    }

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
    // Are we in the Android WebView?
    const isAndroid = import.meta.env.MODE === "android";

    // Tell the user flashing is currently not supported.
    // TODO: Make it possible.
    // To do this, we're going to have to clone esptool-js and add support for our polyfill.
    if (isAndroid) return getInput("Sorry, flashing is currently not supported on mobile.", "", "", ["Okay"], true);

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

    if (flashingStage === "not_started" || flashingStage === "error") {
        // If the flashing process has not started, show the user the file input and instructions
        if (boardType === "espressif" && flashingStage !== "error") {
            // A warning message to ensure the user is using the right type of device
            addMessageBox("warning", "This flasher is for flashing Espressif devices, such as the ESP32 or ESP8266. If this is not the right type of device, reopen the flasher", root);
        }

        if (flashingStage === "error") {
            // If there was an error during flashing, show an error message
            addMessageBox("error", "There was an error during flashing. Feel free to try again, carefully following the instructions. If this still doesn't fix it, please see the developer tools (CTRL+SHIFT+I) for the error and report a bug.", root);
        }

        // The file input for the user to upload the firmware
        addParagraph(fileInput.files.length > 0 ? "Firmware selected. You can change it with the change button if needed." : "First, upload a .bin file for the firmware. You can download this from MicroPython's website.", root);
        addButton(fileInput.files.length > 0 ? "Change" : "Upload", root, () => fileInput.click())

        if (fileInput.files.length > 0) {
            // Explanatory text and button to begin the flashing process
            addParagraph("Now, make sure you're connected to a board by checking the button on the bottom left of the screen.", root);
            addParagraph("If it says you're connected, you're good to go, otherwise, go ahead and click it and choose a serial port.", root);

            // The button to begin the flashing process
            addButton("Continue", root, beginFlash);
        }
    } else if (flashingStage === "getting_ready") {
        // If the flashing process is getting ready, show a message
        addParagraph("Getting ready to flash MicroPython...", root);
        if (boardType === "espressif") addParagraph("Please press and hold the BOOT button on your development board until it starts flashing.", root);
    } else if (flashingStage === "flashing") {
        // If the flashing process is in progress, show a message and a progress bar
        addParagraph("Flashing MicroPython...", root);
        addParagraph("At this point, if you disconnect your board/close this tab you will need to flash it again to be able to use it.", root);

        // The progress bar showing the flashing progress
        const percentHolder = document.createElement("progress");

        // Only set the max and value if we have some progress to show
        // This makes the progress bar indeterminate until we have some progress
        if (flashingAmountDone > 0) {
            percentHolder.max = flashingTotal;
            percentHolder.value = flashingAmountDone;
        }
        root.appendChild(percentHolder);
    } else if (flashingStage === "done") {
        // If the flashing process is done, show a message and a button to refresh the IDE
        addParagraph("Done flashing!", root);
        addParagraph("Your board should now be running MicroPython.", root);

        addParagraph("To get started with MicroMonkey, reboot your device.", root);
        if (boardType === "espressif") addParagraph("On an ESP32 or ESP8266, this is done by pressing the EN button.", root);
        addParagraph("You may need to press the refresh button in the file explorer once or twice to retrieve the file listing from your board.", root);
    }
}