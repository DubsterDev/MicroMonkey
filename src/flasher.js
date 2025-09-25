import { Transport, ESPLoader } from "esptool-js";
import { openTab, requestReRender } from "./openFilesManager";
import { addButton, addHeading, addMessageBox, addParagraph } from "./customEditorHelperFunctions";
import { addCommand } from "./commandPalette";
import { connectToBoard, disconnectSerialPort, disconnectSerialPortListeners, getPort } from "./serial";
import SparkMD5 from "spark-md5";

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

const myFilePath = "/.default_files/micromonkey/flasher.mm";

let flashingTotal = 0;
let flashingAmountDone = 0;

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.onchange = () => requestReRender(myFilePath);

export function addFlasherEventListeners() {
    document.getElementById("flashMicroPython").addEventListener("click", openFlasher)
    addCommand("openMicroPythonFlasher", "Flash MicroPython", openFlasher);
}

let device;
let transport;
let flashingStage = "not_started";
let esploader = null
let chip = null;
async function beginFlash() {
    await disconnectSerialPort();
    device = getPort();
    transport = new Transport(device, true);

    flashingStage = "getting_ready";

    requestReRender(myFilePath);
    const flashOptions = {
      transport,
      baudrate: 460800,
      terminal: espLoaderTerminal,
      debugLogging: true,
    };
    esploader = new ESPLoader(flashOptions);
    chip = await esploader.main();
    flashOS();
}

async function flashOS() {
    flashingStage = "flashing";
    requestReRender(myFilePath);
    await esploader.eraseFlash();
    const osString = await loadOSIntoString();

    const fileArray = [{ data: osString, address: parseInt("0x1000") }];
    const flashOptions = {
        fileArray: fileArray,
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
            flashingTotal = total;
            flashingAmountDone = written;
            requestReRender(myFilePath);
        },
        calculateMD5Hash: (image) => SparkMD5.hashBinary(image),
    }

    await esploader.writeFlash(flashOptions);
    await esploader.after();

    flashingStage = "done";
    requestReRender(myFilePath);
}

function loadOSIntoString() {
    return new Promise((resolve) => {
        const micropythonReader = new FileReader();
        micropythonReader.onload = (ev) => {
            resolve(ev.target.result);
        }

        micropythonReader.readAsBinaryString(fileInput.files[0]);
    })
}

function openFlasher() {
    openTab(myFilePath, "MicroPython Flasher", "custom", renderFlasherPage);
}

function renderFlasherPage(root) {
    addHeading("MicroPython Flasher", "h2", root);
    if (flashingStage === "not_started") {
        addMessageBox("warning", "Currently this flasher only supports Espressif boards, such as the ESP32 or ESP8266.", root);
        addParagraph(fileInput.files.length > 0 ? "Firmware selected" : "You must upload the firmware to flash.", root);
        addButton(fileInput.files.length > 0 ? "Change" : "Upload", root, () => fileInput.click())
        addParagraph("Connect to a board with the button on the bottom left, then press continue.", root);
        addParagraph("Press and hold the Boot button on your board while pressing the continue button.", root);
        addButton("Continue", root, beginFlash);
    } else if (flashingStage === "getting_ready") {
        addParagraph("Getting ready to flash MicroPython...", root);
    } else if (flashingStage === "flashing") {
        addParagraph("Flashing MicroPython...", root);

        const percentHolder = document.createElement("progress");
        percentHolder.max = flashingTotal;
        percentHolder.value = flashingAmountDone;
        root.appendChild(percentHolder);
    } else if (flashingStage === "done") {
        addParagraph("Done flashing.", root);
        addParagraph("Reboot your device by pressing the EN button.", root);
        addParagraph("Then, refresh MicroMonkey and reconnect.", root);
        addButton("Refresh MicroMonkey", root, () => location.reload());
    }
}