// Import XTerm dependencies
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css';

// Create some variables to be defined later
let activePort;
let reader;
let writer;

// Get the elements for the serial monitor and the panel that holds the tabs, editor, and serial monitor
const serialMonitor = document.getElementById("serialMonitor");
const rightPanel = document.getElementById("rightPanel");

// Create the terminal
const terminalFontSize = 18;
const terminal = new Terminal({
    cursorBlink: true,
    disableStdin: false,
    fontSize: terminalFontSize,
    fontFamily: "Open Sans",
    letterSpacing: "0px",
    rows: Math.floor((serialMonitor.clientHeight - (terminalFontSize * 2)) / terminalFontSize),
    cols: Math.floor((serialMonitor.clientWidth) / terminalFontSize)
});

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
 */
export async function writeFile(code, filename = "main.py") {
    // If the serial port has not been opened, exit
    if (!activePort || !writer) return;

    // If the filename starts with a slash, remove it
    if (filename.startsWith("/")) {
        filename = filename.replace("/", "");
    }

    // Interrupt the script a few times to make sure it is not running anything
    // when we try to execute
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Start raw mode on the board
    await rawMode(true);

    // Open the file
    await writeString(`file = open("${filename.replaceAll("\"", "\\\"")}", "w")`);

    // Write the file onto the board in chunks
    for (let i = 0; i < code.length; i += 125) {
        const snippet = code.slice(i, i + 125);
        await writeString(`file.write("${snippet.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);
    }

    // Close the file
    await writeString(`file.close()`);

    // Execute the code
    await runRawCode();

    // Disable raw mode
    await rawMode(false);

    // Interrupt any scripts
    await interruptScript();

    // Reboot the board
    await softReboot();
}

/**
 * Retrieve the contents of a file from the board
 * @param {string} filename The path to the file that you want to read
 * @returns {Promise<string>} The contents of the file, or null
 */
export function getFile(filename) {
    // Exit early if we are not connected to a board
    if (!activePort || !writer) return;

    return new Promise(async (resolve) => {
        // A string to print before the data and after the data has been printed
        const readingString = "[File Reader Reading]";
        const doneReadingString = "[File Reader Reading Done]";

        // To store the file data, as it is retrieved in chunks
        let fileData = "";

        // This function is called whenever data is sent from the board
        function dataReceived(event) {
            // Add the output to file data
            fileData += event.detail;

            if (fileData.includes(`${readingString}\r\n`)) {
                // If the readingString was just outputted, get rid of
                // everything before and including, it
                fileData = fileData.split(`${readingString}\r\n`)[1];
            } else if (fileData.includes(`\r\n${doneReadingString}`)) {
                // If the doneReadingString was just outputted, get rid of
                // anything after, and including, it
                fileData = fileData.split(`\r\n${doneReadingString}`)[0];

                // Delete the event listener for new data
                document.removeEventListener("esp32-data", dataReceived);

                // Resolve the promise with the file data
                resolve(fileData);
            }
        }

        // Register for data from the board
        document.addEventListener("esp32-data", dataReceived);

        // Interrupt the script a few times to make sure there's nothing running
        await interruptScript();
        await interruptScript();
        await interruptScript();

        // Wait a little bit for the interrupted script to terminate
        await wait(100);

        // Enter raw mode
        await rawMode(true);

        // Open the file on the board
        await writeString(`file = open("${filename.replaceAll("\"", "\\\"")}", "r")`);

        // Print the reading string
        await writeString(`print("${readingString}")`)

        // Print the contents of the file
        await writeString(`print(file.read())`)

        // Print the done reading string
        await writeString(`print("${doneReadingString}")`)

        // Close the file
        await writeString(`file.close()`)
        
        // Run the code
        await runRawCode();

        // Exit raw mode
        await rawMode(false);

        // Interrupt the script
        await interruptScript();
    })
}

/**
 * Retrieve a recursive object of files and folders on the connected board
 * @returns {Promise<object>} A promise that resolves to a JSON object, or null
 */
export function getFiles() {
    // Exit early if not connected
    if (!activePort || !writer) return;

    return new Promise(async (resolve) => {
        // Define the reading and done reading strings
        const readingString = "[Grabbing List of Files]";
        const doneReadingString = "[Grabbing List of Files Done]";

        // Define a variable to hold the data from the board
        let fileData = "";

        // A function to be called when we get data from the board
        function dataReceived(event) {
            // Add the data to the fileData variable
            fileData += event.detail;

            if (fileData.includes(`${readingString}\r\n`)) {
                // If we started reading, get rid of all the data before,
                // and including, the reading string
                fileData = fileData.split(`${readingString}\r\n`)[1];
            } else if (fileData.includes(`\r\n${doneReadingString}`)) {
                // If we stopped reading, get rid of all the data before,
                // and including, the done reading string
                fileData = fileData.split(`\r\n${doneReadingString}`)[0];

                // Remove the event listener for new data
                document.removeEventListener("esp32-data", dataReceived);

                // Parse the object and resolve with it
                resolve(JSON.parse(fileData.replaceAll("'", "\"")));
            }
        }

        // Register an event listener for data outputted from the board
        document.addEventListener("esp32-data", dataReceived);

        // Interrupt any scripts that are running
        await interruptScript();
        await interruptScript();
        await interruptScript();

        // Wait a bit to allow any scripts to terminate
        await wait(100);

        // Enter raw mode on the board
        await rawMode(true);

        // Import OS library
        await writeString(`import os`);

        // Print the reading string
        await writeString(`print("${readingString}")`)
        
        // Define the script to read the contents of the board
        const readingScript = `import os
def get_contents_of_dir(dir_name="/"):
    files = os.ilistdir(dir_name)
    result = {}
    for file in files:
        if (file[1] == 0x4000):
            result[file[0]] = get_contents_of_dir(dir_name + "/" + file[0])
        else:
            result[file[0]] = file[0]
    return result
print(get_contents_of_dir())`.split("\n");

        // Loop through and run the script
        for (let line of readingScript) {
            await wait(100);
            await writeString(line);
        }

        // Print the done reading string
        await writeString(`print("${doneReadingString}")`)

        // Run the code
        await runRawCode();

        // Exit raw mode
        await rawMode(false);

        // Interrupt the script one last time
        await interruptScript();
    })
}

/**
 * Create a new file on the board. The parent directory must already exist.
 * @param {string} filePath The path to the file to create
 */
export async function createFile(filePath) {
    // Exit early if we are not connected to a board
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(100);

    // Enter raw mode on the board
    await rawMode(true);

    // Import the OS library
    await writeString(`import os`);

    // Open the file
    await writeString(`f = open("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);

    // Close the file
    await writeString(`f.close()`);

    // Run the code, exit raw mode, and interrupt any running scripts
    await runRawCode();
    await rawMode(false);
    await interruptScript();
}

/**
 * Create a new directory on the board. The parent directory must already exist.
 * @param {string} filePath The path to the directory to create
 */
export async function createDirectory(filePath) {
    // Exit early if we are not connected to a board
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(100);

    // Enter raw mode on the board
    await rawMode(true);

    // Import the OS library
    await writeString(`import os`);

    // Use os.mkdir to create the folder
    await writeString(`os.mkdir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);

    // Run the code, exit raw mode, and interrupt any running scripts
    await runRawCode();
    await rawMode(false);
    await interruptScript();
}


/**
 * Rename a file that is on the board
 * @param {string} oldFilePath The current path on the board
 * @param {string} newFilePath The path to rename to
 */
export async function renameFile(oldFilePath, newFilePath) {
    // Exit early if we are not connected to the board
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to finish
    await wait(100);

    // Enter raw mode on the board
    await rawMode(true);

    // Import the OS library
    await writeString(`import os`);

    // Rename the file using os.rename
    await writeString(`os.rename("${oldFilePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}", "${newFilePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);

    // Run the code
    await runRawCode();

    // Exit raw mode
    await rawMode(false);

    // And interrupt any scripts
    await interruptScript();
}

/**
 * Delete a file on the board
 * @param {string} filePath The path to the file to remove
 */
export async function removeFile(filePath) {
    // If we are not connected, exit early
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a little bit for the script to terminate
    await wait(100);

    // Enter raw mode
    await rawMode(true);

    // Import the OS library
    await writeString(`import os`);

    // Use os.remove to delete the file
    await writeString(`os.remove("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);

    // Run the code
    await runRawCode();

    // Exit raw mode and interrupt the script
    await rawMode(false);
    await interruptScript();
}

/**
 * Delete a empty directory off of the board
 * @param {string} filePath The path to the directory to remove
 */
export async function removeDirectory(filePath) {
    // Exit early if we are not connected to a board
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(100);

    // Enter raw mode on the board
    await rawMode(true);

    // Import the OS library
    await writeString(`import os`);

    // Use os.rmdir to delete the folder
    await writeString(`os.rmdir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`);

    // Run the code, exit raw mode, and interrupt any running scripts
    await runRawCode();
    await rawMode(false);
    await interruptScript();
}

/**
 * Recursively delete a directory and all it's contents off of the board
 * @param {string} filePath The path to the directory to remove
 */
export async function removeDirectoryRecursively(filePath) {
    // Exit early if we are not connected to a board
    if (!activePort || !writer) return;

    // Interrupt any running scripts
    await interruptScript();
    await interruptScript();
    await interruptScript();

    // Wait a bit for any running scripts to terminate
    await wait(100);

    // Enter raw mode on the board
    await rawMode(true);

    // Define the script to delete the contents of the directory
    const deleteScript = `import os
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
recursively_delete_dir("${filePath.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "")}")`.split("\n")

    // Loop through and run the script
    for (let line of deleteScript) {
        await wait(100);
        await writeString(line);
    }

    // Run the code, exit raw mode, and interrupt any running scripts
    await runRawCode();
    await rawMode(false);
    await interruptScript();
}

/**
 * Writes text to the board
 * @param {string} string The line to write to the board
 * @param {string} newlineString The characters used to terminate the line. If you don't want to advance to the next line, pass an empty string.
 */
export function writeString(string, newlineString = "\r\n") {
    // Exit early if there is no board to target
    if (!activePort || !writer) return;

    // Encode the text using TextEncoder, and then write it
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(string + newlineString);
    return writer.write(encoded);
}

/**
 * Enable or disable raw mode
 * @param {boolean} enable Whether to enable or disable
 */
function rawMode(enable = true) {
    // If there is no connection to a board, exit early
    if (!activePort || !writer) return;

    // Write a code to the board to enable or disable
    return writer.write(new Uint8Array([enable ? 0x01 : 0x02]));
}

/**
 * Execute CTRL+D on the board to execute raw code.
 */
function runRawCode() {
    // If a connection has not been established with a board, exit early
    if (!activePort || !writer) return;

    // Write CTRL+D to the board
    return writer.write(new Uint8Array([0x04]));
}

/**
 * Execute CTRL+C on the board to interrupt a script.
 */
function interruptScript() {
    // Exit early if no connection
    if (!activePort || !writer) return;

    // Write CTRL+C to the board
    return writer.write(new Uint8Array([0x03]));
}

/**
 * Execute CTRL+D on the board to reboot.
 */
function softReboot() {
    // Execute early if needed
    if (!activePort || !writer) return;

    // Clear the terminal
    terminal.clear();

    // Write CTRL+D to the board
    return writer.write(new Uint8Array([0x04]));
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
 * Add event listeners for starting a serial connection
 * @param {*} editor A reference to the monaco editor
 * @param {Function} upandrunningCallback A callback that is called when successfully connected to a board
 */
export function startSerial(editor, upandrunningCallback=() => {}) {
    // Add an event listener for when a board is connected
    navigator.serial.addEventListener("connect", () => {
        // Write the text "[Board Connected]" to the terminal
        terminal.writeln("[Board Connected]");
    });

    // Add an event listener for when the board is disconnected
    navigator.serial.addEventListener("disconnect", () => {
        // Write the text "[Board Disconnected]" to the terminal
        terminal.writeln("[Board Disconnected]");

        // Change the board status button to say a board needs to be connected
        document.getElementById("boardStatus").innerText = "Connect to board";
    });

    // Add an event listener for when the user clicks the find ports button
    document.getElementById("findPorts").addEventListener("click", async () => {
        // Request a CircuitMess device. This will change in the future
        // TODO: Change filters
        const port = await navigator.serial
            .requestPort({
                filters: [{
                    usbProductId: 29987,
                    usbVendorId: 6790
                }, {
                    usbProductId: 6e4,
                    usbVendorId: 4292
                }, {
                    usbProductId: 4097,
                    usbVendorId: 12346
                }]
            });
        
        // Change the board status to Connected
        document.getElementById("boardStatus").innerText = "Connected";

        // Store the received port in a variable that is accessible by other functions
        activePort = port;

        // Open the connection to the port
        await port.open({
            baudRate: 115200
        });

        // Open a writer object
        writer = port.writable.getWriter();

        // Interrupt any running scripts
        await interruptScript();

        // Start getting decoded text from the board
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        // Clear the terminal display and show that the board has been connected
        terminal.clear();
        terminal.writeln("[Board Connected]");

        // Call the up and running callback
        upandrunningCallback();

        // Infinitely loop to read output from the board
        while (true) {
            // Get the output from the reader
            const { value, done } = await reader.read();

            // If done reading, stop looping
            if (done) {
                // Allow the serial port to be closed later.
                reader.releaseLock();
                break;
            }

            // Show the output in the REPL
            terminal.write(value);

            // Dispatch an event that anything else can listen to
            const event = new CustomEvent("esp32-data", {
                detail: value
            });
            document.dispatchEvent(event);
        }
    });

    // Toggle the serial monitor's visiblity with the Serial Monitor button
    document.getElementById("openSerialMonitor").addEventListener("click", () => {
        // If it's showing hide it, if it's not, show it
        if (serialMonitor.style.display == "block") {
            serialMonitor.style.display = "none";
        } else {
            serialMonitor.style.display = "block";
        }

        // Update the sizing of the editor based on the height left after removing all the other elements
        editor.layout({
            width: rightPanel.clientWidth,
            height: rightPanel.clientHeight - serialMonitor.clientHeight - document.getElementById("tabs").clientHeight
        });

        // Use the fit addon to fit the terminal
        fitAddon.fit();
    })
}