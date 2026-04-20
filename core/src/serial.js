// Import XTerm dependencies
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css';
import { getSetting } from "./settings";
import { newFolderStructure } from "./fileExplorer";
import JSZip from "jszip";
import { addCommand, removeCommand } from "./commandPalette";

// Get the elements for the serial monitor and the panel that holds the tabs, editor, and serial monitor
const serialMonitor = document.getElementById("serialMonitor");

// Create the terminal
const terminalFontSize = 18;
const terminal = new Terminal({
    cursorBlink: true,
    disableStdin: false,
    fontSize: terminalFontSize,
    fontFamily: "Open Sans",
    letterSpacing: "0px",
    rows: Math.floor((serialMonitor.clientHeight - (terminalFontSize * 2)) / (terminalFontSize + 2)),
    cols: Math.floor((serialMonitor.clientWidth) / terminalFontSize)
});

terminal.attachCustomKeyEventHandler(async (event) => {
    if (event.type === "keydown" && event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c" && terminal.hasSelection()) {
        event.preventDefault();
        event.stopPropagation();
        navigator.clipboard.writeText(terminal.getSelection());
        return false;
    }
})

// Fit the terminal
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

// Start the terminal and forward input to connect board
terminal.open(serialMonitor);
terminal.onData(data => {
    writeString(data, "");
});

/**
 * Writes a file to the board. This file can already exist or be created,
 * as long as the folder containing the new file exists.
 * @param {string} code Contents of the file being written
 * @param {string} filename The path to store the file, e.g. main.py or /utils/utils.py
 * @param {boolean} allowSoftReboot Whether to honor the user preferences for rebooting after save.
 */
export async function writeFile(code, filename, allowSoftReboot = true) {
    // If the serial port has not been opened, exit
    if (!serialInterface.ready) return;

    // If the filename starts with a slash, remove it
    if (filename.startsWith("/")) {
        filename = filename.replace("/", "");
    }

    // Interrupt the script a few times to make sure it is not running anything
    // when we try to execute
    await interruptScript();
    await interruptScript();
    await interruptScript();
    await wait(100);

    // Create code snippet that opens the file
    let fileWriteCode = `file = open("${filename.replaceAll("\"", "\\\"")}", "w")`;

    // Write the file onto the board in chunks
    for (let i = 0; i < code.length; i += 125) {
        const snippet = code.slice(i, i + 125);
        fileWriteCode += `\nfile.write("${snippet.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`;
    }

    // Close the file
    fileWriteCode += `\nfile.close()`;

    // Execute the code
    await runCode(fileWriteCode)

    // Reboot the board if that setting is checked
    if (getSetting("reboot-on-save") && allowSoftReboot) await softReboot();
}

/**
 * Retrieve the contents of a file from the board
 * @param {string} filename The path to the file that you want to read
 * @returns {Promise<string>} The contents of the file, or null
 */
export async function getFile(filename) {
    // Exit early if we are not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt the script a few times to make sure there's nothing running
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a little bit for the interrupted script to terminate
    await wait(250);

    // Get the contents of the file
    const { result } = await runCode(`
file = open("${filename.replaceAll("\"", "\\\"")}", "r")
print(file.read())
file.close()`);

    return result;
}

/**
 * Retrieve a recursive object of files and folders on the connected board
 * @returns {Promise<object>} A promise that resolves to a JSON object, or null
 */
export async function getFiles() {
    // Exit early if not connected
    if (!serialInterface.ready) return;

    // Interrupt any scripts that are running
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit to allow any scripts to terminate
    await wait(250);

    // Read the folders from the board
    const { result } = await runCode(`import os
def get_contents_of_dir(dir_name="/"):
    files = os.ilistdir(dir_name)
    result = {}
    for file in files:
        if (file[1] == 0x4000):
            result[file[0]] = get_contents_of_dir(dir_name + "/" + file[0])
        else:
            result[file[0]] = file[0]
    return result
print(get_contents_of_dir())`);

    return JSON.parse(result.replaceAll("'", "\""));

}

/**
 * Create a new file on the board. The parent directory must already exist.
 * @param {string} filePath The path to the file to create
 */
export async function createFile(filePath) {
    // Exit early if we are not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(250);

    // Run code to create a new file on the board
    await runCode(`import os
f = open("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}", "w")
f.close()`)
}

/**
 * Create a new directory on the board. The parent directory must already exist.
 * @param {string} filePath The path to the directory to create
 */
export async function createDirectory(filePath) {
    // Exit early if we are not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(250);

    // Create a folder on the board
    await runCode(`import os
os.mkdir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);
}


/**
 * Rename a file that is on the board
 * @param {string} oldFilePath The current path on the board
 * @param {string} newFilePath The path to rename to
 */
export async function renameFile(oldFilePath, newFilePath) {
    // Exit early if we are not connected to the board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to finish
    await wait(250);

    // Rename the file on the board
    await runCode(`import os
os.rename("${oldFilePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}", "${newFilePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);
}

/**
 * Delete a file on the board
 * @param {string} filePath The path to the file to remove
 */
export async function removeFile(filePath) {
    // If we are not connected, exit early
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a little bit for the script to terminate
    await wait(250);

    // Delete the file from the board
    await runCode(`import os
os.remove("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`)
}

/**
 * Delete a empty directory off of the board
 * @param {string} filePath The path to the directory to remove
 */
export async function removeDirectory(filePath) {
    // Exit early if we are not connected to a board
    if (!serialInterface.ready) return;

    // Don't do anything if it's an empty slash or a space, these don't work
    if (filePath === "/" || filePath === "\\" || filePath.trim() === "") return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(250);

    // Delete a folder off the board
    await runCode(`import os
os.rmdir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);
}

/**
 * Recursively delete a directory and all it's contents off of the board
 * @param {string} filePath The path to the directory to remove
 */
export async function removeDirectoryRecursively(filePath) {
    // Exit early if we are not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(250);

    // Run the script to delete the contents of the directory
    await runCode(`import os
def recursively_delete_dir(dir_name="/"):
    if (not dir_name.endswith("/")):
        dir_name = dir_name + "/"
    files = os.ilistdir(dir_name)
    for file in files:
        if (file[1] == 0x4000):
            recursively_delete_dir(dir_name + "/" + file[0] + "/")
        else:
            os.remove(dir_name + file[0])
    os.rmdir(dir_name)
recursively_delete_dir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);
}

/**
 * Writes text to the board
 * @param {string} string The line to write to the board
 * @param {string} newlineString The characters used to terminate the line. If you don't want to advance to the next line, pass an empty string.
 */
export function writeString(string, newlineString = "\r\n") {
    // Exit early if there is no board to target
    if (!serialInterface.ready) return;

    // Encode the text using TextEncoder, and then write it
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(string + newlineString);
    return serialInterface.write(encoded);
}

/**
 * Enable or disable raw mode
 * @param {boolean} enable Whether to enable or disable
 */
function rawMode(enable = true) {
    // If there is no connection to a board, exit early
    if (!serialInterface.ready) return;

    // Write a code to the board to enable or disable
    return serialInterface.write(new Uint8Array([enable ? 0x01 : 0x02]));
}

/**
 * Run and retrieve the result of running code in the raw-paste REPL.
 * @param {string} code The code to run
 * @returns {Promise<Object>} The result. Format `{"result": "", "exceptions": ""}`.
 */
export function runCode(code) {
    console.log(code)
    return new Promise(async (resolve) => {
        // Create a new text decoder to use later
        const textDecoder = new TextDecoder();

        // Get a byte array of the code string
        const codeBytes = new TextEncoder().encode(code);

        // Enable raw mode and wait a little bit
        rawMode(true);
        await wait(100);

        // Flags to determine where we are
        // in the process of communicating with the board
        let enteredRawPasteModeSuccessfully = false;
        let gotWindowSize = false;
        let needsToStop = false;
        let doneWriting = false;
        let executing = false;
        let printingExceptions = false;

        // How many bytes we can write
        let windowSize = 0;
        let remainingWindowSize = 0;

        // A "mailbox" of sorts, to store bytes that were not acted upon,
        // these are pushed before the new bytes in the data callback
        let unreadBytes = new Uint8Array();

        // The amount of bytes already pushed to the board
        let bytesWritten = 0;

        // The content of the execution and exceptions
        let executionResult = "";
        let exceptions = "";

        // A serial callback called with new data
        function dataCallback(_, orgBytes) {
            // Add the unread bytes before the received bytes
            // Create a new array of the length of bytes
            let amtOfUnreadBytes = unreadBytes.length;
            let bytes = new Uint8Array(amtOfUnreadBytes + orgBytes.length);

            // Loop through and add the unread bytes first
            for (let i = 0; i < amtOfUnreadBytes; i++) {
                bytes[i] = unreadBytes[i];
            }

            // Clear the unread bytes array
            unreadBytes = new Uint8Array();

            // Loop through the received bytes,
            // adding them after the unread bytes
            for (let i = 0; i < orgBytes.length; i++) {
                bytes[amtOfUnreadBytes + i] = orgBytes[i];
            }

            // A number that stores the amount of bytes we've read
            let alreadyReadBytes = 0;

            // If we haven't entered raw paste mode, and there are two bytes to read...
            if (!enteredRawPasteModeSuccessfully && bytes.length >= alreadyReadBytes + 2) {
                if (bytes[alreadyReadBytes + 0] === 0x52 && bytes[alreadyReadBytes + 1] === 0x01) {
                    // We successfully entered raw paste mode! Store it in a flag
                    enteredRawPasteModeSuccessfully = true;
                } else if (bytes[alreadyReadBytes + 0] === 0x52 && bytes[alreadyReadBytes + 1] === 0x00) {
                    // The board understood the command,
                    // but it doesn't support raw paste mode
                    alert("Hmmm, something didn't work. Your board might not be compatible with MicroMonkey, or you might just need to try that again.");
                    serialInterface.removeSerialCallback(dataCallback);
                } else if (bytes[alreadyReadBytes + 0] === 0x72 && bytes[alreadyReadBytes + 1] === 0x61) {
                    // The board doesn't even know what raw paste mode is
                    alert("Hmmm, something didn't work. Your board might not be compatible with MicroMonkey, or you might just need to try that again.");
                    serialInterface.removeSerialCallback(dataCallback);
                }

                // Increment the read bytes counter
                alreadyReadBytes += 2;
            }

            if (!gotWindowSize && bytes.length >= alreadyReadBytes + 2) {
                // If we just received the window size, get it
                windowSize = (bytes[alreadyReadBytes + 1] << 8) | bytes[alreadyReadBytes + 0];

                // Set the remaining window size and a flag
                remainingWindowSize = windowSize;
                gotWindowSize = true;

                // Increment the read bytes count and start writing data!
                alreadyReadBytes += 2;
                writeWhenReady();
            }

            // If we could be receiving data from the board, loop through it
            for (let i = alreadyReadBytes; i < bytes.length; i++) {
                const byte = bytes[i];

                if (byte === 0x01) {
                    // If the board says to increment the window size
                    // increment it!
                    remainingWindowSize += windowSize;
                    alreadyReadBytes++;
                } else if (byte === 0x04 && doneWriting) {
                    // The board should be printing output now
                    doneWriting = false;
                    executing = true;
                    alreadyReadBytes++;
                } else if (byte === 0x04 && executing) {
                    // Switch from executing status to exception status
                    executing = false;
                    printingExceptions = true;
                    alreadyReadBytes++;
                } else if (byte === 0x04 && printingExceptions) {
                    // Stop reading now that the board should be completely
                    // done outputting data

                    // Remove this callback
                    serialInterface.removeSerialCallback(dataCallback);

                    // Exit raw mode
                    rawMode(false);

                    // Resolve the result, removing the last \r\n
                    resolve({ "result": executionResult.replace(/\r\n$/, ""), "exceptions": exceptions.replace(/\r\n$/, "") });
                    alreadyReadBytes++;
                } else if (byte === 0x04 && !doneWriting) {
                    // This means the board wants to stop receiving data
                    needsToStop = true;
                    alreadyReadBytes++;
                } else if (executing) {
                    // If it's not a special byte, and we are currently
                    // receiving execution results, add to the execution variable
                    executionResult += textDecoder.decode(new Uint8Array([byte]));
                    alreadyReadBytes++;
                } else if (printingExceptions) {
                    // If printing exceptions, add the exception to the
                    // exceptions variable
                    exceptions += textDecoder.decode(new Uint8Array([byte]));
                    alreadyReadBytes++;
                }
            }

            if (alreadyReadBytes < bytes.length) {
                // If there are bytes that aren't read, add them to the unreadBytes variable
                unreadBytes = new Uint8Array(bytes.length - alreadyReadBytes);
                for (let i = alreadyReadBytes; i < bytes.length; i++) {
                    unreadBytes[i - alreadyReadBytes] = bytes[i];
                }
            }
        }

        async function writeWhenReady() {
            // Begin writing bytes. Continues until all bytes are written,
            // or the board says it wants to stop.
            while (bytesWritten < codeBytes.length) {
                // If the board wants to stop, stop.
                if (needsToStop) break;

                // If the board hasn't said it's ready for more bytes, skip writing.
                if (remainingWindowSize === 0) await wait(25);

                // Calculate the amount of bytes we are going to write to the board right now
                const amountToWrite = Math.min(codeBytes.length - bytesWritten, remainingWindowSize);

                // Slice the bytes from the bytes array
                const bytes = codeBytes.slice(bytesWritten, bytesWritten + amountToWrite);

                // Increment the bytes written counter
                bytesWritten += amountToWrite;

                // Write the bytes
                serialInterface.write(bytes);

                // Decrement the remaining window size
                remainingWindowSize -= amountToWrite;
            }

            // Now that we're done writing, let the board know
            serialInterface.write(new Uint8Array([0x04]));
            doneWriting = true;
        }

        // Add the dataCallback for serial events
        serialInterface.addSerialCallback(dataCallback);

        // Enter raw-paste mode
        serialInterface.write(new Uint8Array([0x05, 0x41, 0x01]));
    })

}

/**
 * Execute CTRL+D on the board to execute raw code.
 */
function runRawCode() {
    // If a connection has not been established with a board, exit early
    if (!serialInterface.ready) return;

    // Write CTRL+D to the board
    return serialInterface.write(new Uint8Array([0x04]));
}

/**
 * Execute CTRL+C on the board to interrupt a script.
 */
function interruptScript() {
    // Exit early if no connection
    if (!serialInterface.ready) return;

    // Write CTRL+C to the board
    return serialInterface.write(new Uint8Array([0x03]));
}

/**
 * Execute CTRL+D on the board to reboot.
 */
function softReboot() {
    // Execute early if needed
    if (!serialInterface.ready) return;

    // Clear the terminal
    terminal.clear();

    // Write CTRL+D to the board
    return serialInterface.write(new Uint8Array([0x04]));
}

/**
 * Returns a blob of all the files on the board in ZIP format.
 * @param {string} [type="blob"] What type the output of this function should be. Default is blob, see JSZip's supported types for more information.
 * @see https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html
 * @returns {Promise<Blob>} A promise that resolves to a Blob of the ZIP file.
 */
export async function getAllFilesAsZip(type="blob") {
    // Exit early if not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();
    await wait(500);

    // Get all the files on the board
    const files = await getFiles();

    // A JSZip instance
    const zip = new JSZip();

    // A recursive function that adds files to the zip
    async function addFilesToZip(folder, path) {
        for (const key in folder) {
            if (typeof folder[key] === "string") {
                // If it's a string, it's a file, so get the file and add it to the zip
                const fileContents = await getFile((path !== "" ? path + "/" : "") + folder[key]);
                zip.file((path !== "" ? path + "/" : "") + folder[key], fileContents);
            } else {
                // If it's not a string, it's a folder, so create the folder and call this function again
                zip.folder((path !== "" ? path + "/" : "") + key);
                await addFilesToZip(folder[key], (path !== "" ? path + "/" : "") + key);
            }
        }
    }

    // Start the recursive function
    await addFilesToZip(files, "");

    // Generate the zip and return it as a blob
    return zip.generateAsync({ type: type });
}

/**
 * Loads the contents of a ZIP file onto the connected board.
 * @param {ArrayBuffer} zip Accepts a ArrayBuffer of the ZIP containing the new files.
 * @param {boolean} deleteCurrentFiles Whether or not to delete everything on the board.
 * @returns {Promise<Blob>} A promise that resolves to a Blob of the ZIP file.
 */
export async function uploadAllFilesFromZip(zip, deleteCurrentFiles) {
    // Exit early if not connected to a board
    if (!serialInterface.ready) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();
    await wait(500);

    // Delete all the files on the board
    if (deleteCurrentFiles) await removeDirectoryRecursively("/");

    // A JSZip instance
    const jsZip = new JSZip();

    // Load the ZIP
    await jsZip.loadAsync(zip);

    // Get all the files
    const files = Object.values(jsZip.files);

    // Sort the files so we loop through the directories and create them first
    files.sort((a, b) => {
        if (a.dir !== b.dir) {
            return a.dir ? -1 : 1;
        }

        if (a.dir && b.dir) {
            const slashesA = a.name.split("/").length - 1;
            const slashesB = b.name.split("/").length - 1;

            return slashesA - slashesB;
        }

        return b.name.length - a.name.length;
    })

    // Loop through the zip
    for (let i = 0; i < files.length; i++) {
        await wait(100);
        const file = files[i];

        if (file.dir) {
            await createDirectory(file.name);
            continue;
        }

        const contents = await file.async("text");
        await writeFile(contents.replace("\r", ""), file.name, false);
    }
}

/**
 * Wait for a specified amount of time
 * @param {number} ms How long to wait, in milleseconds
 * @returns {Promise<undefined>} A promise, resolved when the specified amount of time has passed.
 */
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Removes the reader and writer from the serial port,
 * and closes it.
 */
export async function disconnectSerialPort() {
    // Removes listeners
    await serialInterface.preDisconnect();

    // Disconnects it, using the right interface
    serialInterface.disconnect();
}

/**
 * Outputs serial output to terminal.
 */
async function addTerminalCallback() {
    async function terminalDataReceived(text, bytes) {
        terminal.write(text);
    }
    terminalDataReceived.bind(this);
    serialInterface.addSerialCallback(terminalDataReceived)
}

let readyCallback;

/**
 * Finish connecting to a board after getting a reference to the port.
 */
export async function boardConnected() {
    // Change the board status to Connected
    document.getElementById("boardStatus").innerText = "Connected";

    // Clear the terminal display
    terminal.clear();

    // Wait for board to finish booting in case it was just turned on
    await wait(200);

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait for scripts to finish
    await wait(250);

    // Call the up and running callback
    readyCallback();
}

/**
 * Cleans up after a port has been disconnected.
 */
function portDisconnected() {
    // Write the text "[Board Disconnected]" to the terminal
    terminal.writeln("[Board Disconnected]");

    // Change the board status button to say a board needs to be connected
    document.getElementById("boardStatus").innerText = "Connect to board";

    // Clears the file explorer
    newFolderStructure({});
}

/**
 * Toggle the serial monitor state,
 * if it's open close it, if it's closed open it.
 * @param {*} editor The monaco editor
 */
export function toggleTerminal(editor) {
    // If it's showing hide it, if it's not, show it
    if (serialMonitor.style.display == "none") {
        serialMonitor.style.display = "block";
    } else {
        serialMonitor.style.display = "none";
    }

    // Use the fit addon to fit the terminal
    fitAddon.fit();
}

/**
 * Starts the find ports dialog.
 */
export async function findPorts() {
    if (serialInterface.ready) {
        // Disconnect listeners from the Serial Port and close it
        await disconnectSerialPort();

        // Call the callback
        portDisconnected();
    } else {
        // Request a device
        await serialInterface.establishConnection();
    }
}

export function onSerialInterfaceChange() {
    // Start reading output from the board to show in the terminal
    addTerminalCallback();

    serialInterface.onConnect = () => {
        terminal.writeln("[Board Connected]");
        boardConnected();
    }

    // Add an event listener for when the board is disconnected
    serialInterface.onDisconnect = portDisconnected;
}

/**
 * Add event listeners for starting a serial connection
 * @param {*} editor A reference to the monaco editor
 * @param {Function} upandrunningCallback A callback that is called when successfully connected to a board
 */
export function startSerial(editor, upandrunningCallback = () => { }) {
    readyCallback = upandrunningCallback;
    onSerialInterfaceChange();

    // Add an event listener for when the user clicks the find ports button
    document.getElementById("findPorts").addEventListener("click", findPorts);

    // Add a command to the command palette to launch the port selector
    addCommand("findPorts", "Connect to board", findPorts);

    // Toggle the serial monitor's visiblity with the Serial Monitor button
    document.getElementById("openSerialMonitor").addEventListener("click", () => toggleTerminal(editor));

    // Toggle the serial monitor's visibility with the keyboard shortcut CTRL+`
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.code === "Backquote") {
            toggleTerminal(editor);
        }
    });

    // Toggle the serial monitor's visibility with the command palette
    addCommand("toggleSerialMonitor", "Show/Hide Serial Monitor", () => toggleTerminal(editor));

    // Soft-reboot the connected device with the command palette
    addCommand("softRebootDevice", "Reboot connected device", softReboot);
}