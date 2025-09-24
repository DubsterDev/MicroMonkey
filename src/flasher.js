import { Transport, ESPLoader } from "esptool-js";
import { openTab } from "./openFilesManager";
import { addHeading, addMessageBox, addParagraph } from "./customEditorHelperFunctions";
import { addCommand } from "./commandPalette";

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

export function addFlasherEventListeners() {
    document.getElementById("flashMicroPython").addEventListener("click", openFlasher)
    addCommand("openMicroPythonFlasher", "Flash MicroPython", openFlasher);
}

function openFlasher() {
    openTab("/.default_files/micromonkey/flasher.mm", "MicroPython Flasher", "custom", renderFlasherPage);
}

function renderFlasherPage(root) {
    addHeading("MicroPython Flasher", "h2", root);
    addMessageBox("warning", "Currently this flasher only supports Espressif boards, such as the ESP32 or ESP8266.", root);
}