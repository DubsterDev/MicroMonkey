import { Transport, ESPLoader } from "esptool-js";
import { openTab } from "./openFilesManager";
import { addHeading, addMessageBox, addParagraph } from "./customEditorHelperFunctions";

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
    document.getElementById("flashMicroPython").addEventListener("click", () => {
        openTab("/.default_files/micromonkey/flasher.mm", "MicroPython Flasher", "custom", renderFlasherPage);
    })
}

function renderFlasherPage(root) {
    addHeading("MicroPython Flasher", "h2", root);
    addMessageBox("warning", "This flasher only supports Espressif boards, such as the ESP32 or ESP8266, right now.", root);
}