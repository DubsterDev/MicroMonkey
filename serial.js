let activePort;
let reader;
let writer;
const serialMonitor = document.getElementById("serialMonitor");
const serialMonitorOutput = document.getElementById("serialMonitorOutput");

async function writeFile(code, filename = "main.py") {
    if (!activePort || !writer) return;
    await interruptScript();
    await rawMode(true);

    // make directories if needed
    if (filename.includes("/")) {
        let directories = filename.split("/");
        directories.pop();
        await writeString(`import os`);

        let pathSoFar = "";
        for (let i = 0; i < directories.length; i++) {
            pathSoFar += (i > 0 ? "/" : "") + directories[i];
            await writeString(`os.mkdir("${pathSoFar}")`);
        }
    }

    await writeString(`file = open("${filename.replaceAll("\"", "\\\"")}", "w")`);
    for (let i = 0; i < code.length; i += 125) {
        const snippet = code.slice(i, i + 125);
        await writeString(`file.write("${snippet.replaceAll("\"", "\\\"").replaceAll("\\", "\\\\")}")`);
    }
    await writeString(`file.close()`);
    await runRawCode();
    await rawMode(false);
    await interruptScript();
    await softReboot();
}

function getFile(filename) {
    if (!activePort || !writer) return;
    return new Promise(async (resolve) => {

        const readingString = "[File Reader Reading]";
        const doneReadingString = "[File Reader Reading Done]";
        let fileData = "";

        function dataReceived(event) {
            fileData += event.detail;
            if (fileData.includes(`${readingString}\r\n`)) {
                fileData = fileData.split(`${readingString}\r\n`)[1];
            } else if (fileData.includes(`\r\n${doneReadingString}`)) {
                fileData = fileData.split(`\r\n${doneReadingString}`)[0];
                document.removeEventListener("esp32-data", dataReceived);
                resolve(fileData);
            }
        }
        document.addEventListener("esp32-data", dataReceived);
        await interruptScript();
        await rawMode(true);
        await writeString(`file = open("${filename.replaceAll("\"", "\\\"")}", "r")`);
        await writeString(`print("${readingString}")`)
        await writeString(`print(file.read())`)
        await writeString(`print("${doneReadingString}")`)
        await writeString(`file.close()`)
        await runRawCode();
        await rawMode(false);
        await interruptScript();
    })
}

function getFiles() {
    if (!activePort || !writer) return;
    return new Promise(async (resolve) => {

        const readingString = "[Grabbing List of Files]";
        const doneReadingString = "[Grabbing List of Files Done]";
        let fileData = "";

        function dataReceived(event) {
            fileData += event.detail;
            if (fileData.includes(`${readingString}\r\n`)) {
                fileData = fileData.split(`${readingString}\r\n`)[1];
            } else if (fileData.includes(`\r\n${doneReadingString}`)) {
                fileData = fileData.split(`\r\n${doneReadingString}`)[0];
                document.removeEventListener("esp32-data", dataReceived);
                resolve(JSON.parse(fileData.replaceAll("'", "\"")));
            }
        }
        document.addEventListener("esp32-data", dataReceived);
        await interruptScript();
        await rawMode(true);
        await writeString(`import os`);
        await writeString(`print("${readingString}")`)
        await writeString(`print(os.listdir())`)
        await writeString(`print("${doneReadingString}")`)
        await runRawCode();
        await rawMode(false);
        await interruptScript();
    })
}



function writeString(string, newlineString = "\r\n") {
    if (!activePort || !writer) return;

    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(string + newlineString);
    return writer.write(encoded);
}

function rawMode(enable = true) {
    if (!activePort || !writer) return;
    return writer.write(new Uint8Array([enable ? 0x01 : 0x02]));
}

function runRawCode() {
    if (!activePort || !writer) return;
    return writer.write(new Uint8Array([0x04]));
}

function interruptScript() {
    if (!activePort || !writer) return;
    return writer.write(new Uint8Array([0x03]));
}

function softReboot() {
    if (!activePort || !writer) return;
    return writer.write(new Uint8Array([0x04]));
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function sendDummyData() {
    for (let i = 0; i < 20; i++) {
        await wait(100);
        await writeString("print('hi')");
    }
}

navigator.serial.addEventListener("connect", (e) => {
    console.log("connect", e.target);
})

navigator.serial.addEventListener("disconnect", (e) => {
    document.getElementById("boardStatus").innerText = "Connect to board";
    console.log("disconnect", e.target);
});

document.getElementById("findPorts").addEventListener("click", async () => {
    // request a circuitmess device
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
    document.getElementById("boardStatus").innerText = "Connected";
    activePort = port;
    await port.open({
        baudRate: 115200
    });
    writer = port.writable.getWriter();

    await interruptScript();

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();
    
    sendDummyData();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            // Allow the serial port to be closed later.
            reader.releaseLock();
            break;
        }

        serialMonitorOutput.innerText += value;

        const event = new CustomEvent("esp32-data", {
            detail: value
        });
        document.dispatchEvent(event);
    }
});

document.getElementById("openSerialMonitor").addEventListener("click", () => {
    if (serialMonitor.style.display == "block") {
        serialMonitor.style.display = "none";
    } else {
        serialMonitor.style.display = "block";
    }
})