// Import dependencies from esptool-js and spark-md5
import { ESPLoader, Transport } from "esptool-js";
import SparkMD5 from "spark-md5";
import { connectToBoard } from "./serial";

// A simple terminal object to log messages from esptool-js to the console
const espLoaderTerminal = {
  clean() {
    console.clear()
  },
  writeLine(data) {
    console.log(data)
  },
  write(data) {
    console.log(data)
  }
}

// Variables to hold the transport, esploader, and chip objects
let transport;
let esploader = null;
let chip = null;

/**
 * Starts flashing an Espressif device with the provided firmware file.
 * @param {*} device The serial port to flash
 * @param {Function} setFlashingStage A callback used to update the flashing stage. Called with one parameter, the stage as a string
 * @param {Function} setFlashingProgress A callback used to update the flashing progress. Called with two parameters, total amount to flash and amount that has been flashed
 * @param {File} file The firmware file to flash
 */
export async function flashESP(device, setFlashingStage, setFlashingProgress, file) {
    // Create a new transport object for the serial port
    transport = new Transport(device, true);
    
    // Update the flashing stage to "getting_ready"
    setFlashingStage("getting_ready");

    // Define some flashing options
    const flashOptions = {
        transport,
        baudrate: 460800,
        terminal: espLoaderTerminal,
        debugLogging: false,
    };

    // Create a new esploader object with the flashing options
    esploader = new ESPLoader(flashOptions);
    
    // Detect the chip
    try {
      chip = await esploader.main();
    } catch (e) {
      console.error("Error during chip detection:", e);
      setFlashingStage("error");
      await transport.disconnect();
      return;
    }

    // Start flashing MicroPython
    flashOS(setFlashingStage, setFlashingProgress, file, device);
}

/**
 * Flash the file to the device using esptool-js
 * @param {Function} setFlashingStage A callback used to update the flashing stage, called with one parameter, the stage as a string
 * @param {Function} setFlashingProgress A callback used to update the flashing progress, called with two parameters, total amount to flash and amount that has been flashed
 * @param {File} file The firmware file to flash
 * @param {*} device The serial port to flash
 */
async function flashOS(setFlashingStage, setFlashingProgress, file, device) {
    // Update the flashing stage to "flashing"
    setFlashingStage("flashing");

    // Erase the flash memory
    await esploader.eraseFlash();

    // Load the firmware file into a binary string
    const osString = await loadOSIntoString(file);

    // Create a file array with the firmware data and the address to flash it to
    const fileArray = [{ data: osString, address: parseInt("0x1000") }];

    // Create the flash options
    const flashOptions = {
        fileArray: fileArray,
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
            setFlashingProgress(total, written);
        },
        calculateMD5Hash: (image) => SparkMD5.hashBinary(image),
    }

    // Write the flash and finalize
    await esploader.writeFlash(flashOptions);
    await esploader.after();
    await transport.disconnect();
    
    // Try to reconnect to the board so the user can use it right away
    await connectToBoard(device);

    // Update the flashing stage to "done"
    setFlashingStage("done");
}


/**
 * Loads a file into a binary string.
 * @param {File} file The file to load into a binary string
 * @returns {Promise<string>} A promise that resolves to the binary string of the file
 */
function loadOSIntoString(file) {
    return new Promise((resolve) => {
        // Create a new FileReader to read the file
        const micropythonReader = new FileReader();

        micropythonReader.onload = (ev) => {
            // When the file is loaded, resolve the promise with the binary string
            resolve(ev.target.result);
        }

        // Read the file as a binary string
        // TODO: Modify this to use a non-deprecated method
        micropythonReader.readAsBinaryString(file);
    })
}