import { Transport, ESPLoader } from "esptool-js";
import { openTab, requestReRender } from "./openFilesManager";
import { addButton, addHeading, addMessageBox, addParagraph } from "./customEditorHelperFunctions";
import { addCommand } from "./commandPalette";
import { disconnectSerialPort, disconnectSerialPortListeners, getPort } from "./serial";

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

}

function openFlasher() {
    openTab(myFilePath, "MicroPython Flasher", "custom", renderFlasherPage);
}

function renderFlasherPage(root) {
    addHeading("MicroPython Flasher", "h2", root);
    if (flashingStage === "not_started") {
        addMessageBox("warning", "Currently this flasher only supports Espressif boards, such as the ESP32 or ESP8266.", root);
        addParagraph("Connect to a board with the button on the bottom left, then press continue.", root);
        addParagraph("Press and hold the EN button on your board while pressing the continue button.", root);
        addButton("Continue", root, beginFlash);
    } else if (flashingStage === "getting_ready") {
        addParagraph("Getting ready to flash MicroPython...", root);
    }
}