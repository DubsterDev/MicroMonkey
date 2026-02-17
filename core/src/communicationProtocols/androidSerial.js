// The Android Serial Protocol
export class AndroidSerial {
    serialCallbacks = [];
    onConnect;
    onDisconnect;

    ready = false;

    // TODO: Make it possible.
    // To do this, we're going to have to clone esptool-js and add support.
    supportsFlashing = false;

    /**
     * Initializes Android Serial and connects immediately.
     */
    constructor() {
        this.establishConnection();
    }

    /**
     * For compatability
     */
    async establishConnection() {
        if (serialPolyfill.requestPort()) {
            this.ready = true;
            if (this.onConnect) this.onConnect();
        }
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
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        serialPolyfill.write(btoa(binary));
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
        ready = false;
    }
    
    /**
     * Closes the serial port. Call preDisconnect first!
     */
    async disconnect() {
        if (this.onDisconnect) this.onDisconnect();
    }

    /**
     * Notifies callbacks of serial data
     * @param {Uint8Array} bytes
     */
    async serialDataReceived(bytes) {
        // Create a textDecoder
        const textDecoder = new TextDecoder();

        // Convert to UTF-8
        const text = textDecoder.decode(bytes);

        // Call the registered callbacks with the text and bytes just received
        this.serialCallbacks.forEach(callback => {
            callback(text, bytes);
        })
    }

    /**
     * Callback used by Android app to send Serial data
     */
    async _receiveSerialData(base64) {
        // Get a binary string of the base64
        const binaryString = atob(base64);

        // Convert it to a Uint8Array
        const value = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            value[i] = binaryString.charCodeAt(i);
        }

        this.serialDataReceived(value);
    }
}