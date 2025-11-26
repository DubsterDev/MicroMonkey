// The Web Serial Protocol

export class WebSerial {
    port;
    reader;
    writer;
    serialCallbacks = [];
    onConnect;
    onDisconnect;

    ready = false;
    supportsFlashing = true;

    /**
     * Creates the WebSerial class.
     * @param {*} port A serial port to start with, or null
     */
    constructor(port=null) {
        if (port) {
            // If a port was passed, set it up
            this.port = port;
            this.finishConnecting();
        }

        // Add an event listener for new devices
        navigator.serial.addEventListener("connect", (ev) => {
            // If we haven't already connected to something, connect to this one
            if (!this.ready) this.setPort(ev.target);
        });

        // Add an event listener for disconnected devices
        navigator.serial.addEventListener("disconnect", (ev) => {
            // Set the ready state to false and call the onDisconnect callback
            this.ready = false;
            if (this.onDisconnect) this.onDisconnect();
        })
    }

    /**
     * Requests a serial port and connects to it
     */
    async establishConnection() {
        // Prompt the user to pick a serial port
        this.port = await navigator.serial.requestPort();
        this.finishConnecting();
    }

    /**
     * Open the port and start reading
     */
    async finishConnecting() {
        // Open the port
        await this.port.open({
            baudRate: 115200
        });

        // Get a writer and reader
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader()

        // Set the ready state
        this.ready = true;

        // Start reading output
        this.startReading();

        // Call the onConnect callback
        if (this.onConnect) this.onConnect();
    }

    /**
     * Manually connects to a specific serial port
     * @param {*} port The serial port to connect to
     */
    async setPort(port) {
        // Set the port and finish connecting
        this.port = port;
        this.finishConnecting();
    }

    /**
     * Writes the bytes to the Serial Port
     * @param {Uint8Array} bytes The bytes to write
     */
    async write(bytes) {
        this.writer.write(bytes);
    }
    

    /**
     * Add a callback that will be called when new serial data is received
     * @param {Function} callback The callback. Called with two parameters: text, bytes
     */
    addSerialCallback(callback) {
        this.serialCallbacks.push(callback);
    }

    /**
     * Remove a callback that is called when new serial data is received
     * @param {Function} callback The callback to be removed
     */
    removeSerialCallback(callback) {
        this.serialCallbacks.splice(this.serialCallbacks.indexOf(callback), 1)
    }

    /**
     * Start disconnecting from the serial port
     */
    async preDisconnect() {
        // Cancels and releases the lock of the reader stream
        await this.reader.cancel();
        this.reader.releaseLock();

        // Closes and releases the lock of the writer stream
        await this.writer.close();
        this.writer.releaseLock();
        this.ready = false;
    }
    
    /**
     * Closes the serial port. Call preDisconnect first!
     */
    async disconnect() {
        await this.port.close();
        if (this.onDisconnect) this.onDisconnect();
    }

    /**
     * Reads output from the port and calls callbacks
     */
    async startReading() {
        // Create a textDecoder
        const textDecoder = new TextDecoder();

        // Infinitely loop to read output from the board
        while (true) {
            // Get the output from the reader
            const { value, done } = await this.reader.read();

            // If done reading, stop looping
            if (done) {
                // Allow the serial port to be closed later.
                this.reader.releaseLock();
                break;
            }

            // Convert to UTF-8
            const text = textDecoder.decode(value);

            // Call the registered callbacks with the text and bytes just received
            this.serialCallbacks.forEach(callback => {
                callback(text, value);
            })
        }
    }
}