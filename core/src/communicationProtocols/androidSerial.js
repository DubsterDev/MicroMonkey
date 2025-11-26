// The Android Serial Protocol
export class AndroidSerial {
    webSocket;
    serialCallbacks = [];
    onConnect;
    onDisconnect;

    ready = false;

    // TODO: Make it possible.
    // To do this, we're going to have to clone esptool-js and add support.
    supportsFlashing = false;

    /**
     * Opens the WebSocket
     */
    async establishConnection() {
        const myUrl = new URL(location.href).host
        this.webSocket = new WebSocket(`ws://${myUrl}/serial`);
        this.webSocket.onopen = () => {
            this.ready = true;
            if (this.onConnect) this.onConnect();
        }
        this.webSocket.onclose = () => {
            this.ready = false;
            if (this.onDisconnect) this.onDisconnect();
        }

        this.webSocket.addEventListener("message", this.serialDataReceived.bind(this));
    }

    /**
     * For compatibility
     * @param {*} port The serial port to connect to
     */
    async setPort(port) {
    }

    /**
     * Writes the bytes to the Serial Port
     * @param {Uint8Array} bytes The bytes to write
     */
    async write(bytes) {
        this.webSocket.send(bytes);
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
     * Start disconnecting from the serial port, for compatibility
     */
    async preDisconnect() {
    }
    
    /**
     * Closes the serial port. Call preDisconnect first!
     */
    async disconnect() {
        await this.webSocket.close();
        if (this.onDisconnect) this.onDisconnect();
    }

    /**
     * Notifies callbacks of serial data
     */
    async serialDataReceived(ev) {
        // Convert the blob to an arraybuffer
        const bytes = new Uint8Array(await ev.data.arrayBuffer());

        // Create a textDecoder
        const textDecoder = new TextDecoder();

        // Convert to UTF-8
        const text = textDecoder.decode(bytes);

        // Call the registered callbacks with the text and bytes just received
        this.serialCallbacks.forEach(callback => {
            callback(text, bytes);
        })
    }
}