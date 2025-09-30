// Import the updateDiagnostics function to send diagnostics to the editor
import { updateDiagnostics } from "./editor";

// Import the JSON file containing type stubs
import stubs from "./stub-bundle.json";

// The pyright web worker, defined later
let pyrightWorker;

// The currently open file
let currentlyOpenUri = "";

// The request ID that needs to be passed with every request to the web worker
let requestId = 0;

// A object containing a version number for each file
const fileVersions = {};

/**
 * Starts the pyright web worker and initializes it.
 */
export function initializePyright() {
    // Start the web worker
    pyrightWorker = new Worker("pyright/pyright.worker.js");

    // Add a event listener for diagnostics and log messages
    pyrightWorker.addEventListener("message", (event) => {
        const data = event.data;
        if (data.method === "textDocument/publishDiagnostics") {
            updateDiagnostics(data.params.diagnostics, data.params.uri.replaceAll("/" + encodeURIComponent("<default workspace root>") + "/", "micromonkey/"));
        } else if (data.method === "window/logMessage") {
            console.log("pyright message", data.params.message);
        }
    })

    // Terminate the worker when the window is closed
    window.addEventListener("beforeunload", () => {
        pyrightWorker.terminate();
    })

    // Intialize pyright by sending an initialize request
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        id: requestId++,
        method: 'initialize',
        params: {
            rootUri: 'file:///',
            capabilities: {
                general: {
                    trace: "verbose"
                }
            },
            initializationOptions: {
                files: {
                    ...stubs,
                    "/src/pyrightconfig.json": JSON.stringify({
                        "typeCheckingMode": "basic",
                        "typeshedPath": "/typeshed/",
                        "reportMissingModuleSource": false,
                        "verboseOutput": true
                    })
                }
            }
        }
    });
}

/**
 * Tell pyright a new file was opened
 * @param {string} uri The URI of the file
 * @param {string} content The contents of the file
 */
export function openFile(uri, content) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");

    // Set the version of the file
    fileVersions[uri] = 1;

    // If another file is currently open, close it
    if (currentlyOpenUri !== "") closeFile(currentlyOpenUri);

    // Send the open notification to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
            textDocument: {
                uri: uri,
                languageId: 'python',
                version: fileVersions[uri],
                text: content
            },
        },
    });

    // Set the currently open uri
    currentlyOpenUri = uri;
}

/**
 * Tell pyright a file was closed
 * @param {string} uri The URI of the file
 */
export function closeFile(uri) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    
    // Send the close notification to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/didClose',
        params: {
            textDocument: {
                uri: uri
            },
        },
    });
}


/**
 * Update the contents of the file in pyright's virtual file system and rerun diagnostics
 * @param {string} uri The URI of the file
 * @param {Array} changes An array of changes made to the file
 */
export function updateFile(uri, changes) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    
    // Send the change notification to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/didChange',
        params: {
            textDocument: {
                uri: uri,
                version: fileVersions[uri]++,
            },
            contentChanges: changes,
        },
    });
}

/**
 * Get autocompletion suggestions from pyright
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format, `{ line: 0, character: 0 }`, where line and character are 0-indexed, unlike Monaco, which is 1-indexed
 * @returns {Promise<Array>} A promise that resolves to an array of completion items
 */
export function getCompletions(uri, position = { line: 0, character: 0 }) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");

    // Store and increment the request ID
    const usedRequestId = requestId++;

    // Send the completion request to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        id: usedRequestId,
        method: 'textDocument/completion',
        params: {
            textDocument: { uri: uri },
            position: position,
            context: { triggerKind: 1 }
        },
    });

    // Return a promise that resolves when the response is received
    return new Promise((resolve) => {
        function messageReceived(event) {
            // When a message is received, check if it's the response to this request
            const data = event.data;
            if (data.id === usedRequestId) {
                // If it is, resolve with the result
                resolve(data.result);

                // And remove this event listener
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        // Add an event listener for new messages from the worker
        pyrightWorker.addEventListener("message", messageReceived);
    });
}

/**
 * Get signature help from pyright
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format, `{ line: 0, character: 0 }`, where line and character are 0-indexed, unlike Monaco, which is 1-indexed
 * @returns {Promise<Object>} A promise that resolves to a signature help object
 */
export function getSignatureHelp(uri, position = { line: 0, character: 0 }) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");

    // Store and increment the request ID
    const usedRequestId = requestId++;

    // Send the signature help request to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        id: usedRequestId,
        method: 'textDocument/signatureHelp',
        params: {
            textDocument: { uri: uri },
            position: position,
            context: {
                triggerKind: 1
            }
        }
    });

    // Return a promise that resolves when the response is received
    return new Promise((resolve) => {
        function messageReceived(event) {
            // When a message is received, check if it's the response to this request
            const data = event.data;
            if (data.id === usedRequestId) {
                // If it is, resolve with the result
                resolve(data.result);

                // And remove this event listener
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        // Add an event listener for new messages from the worker
        pyrightWorker.addEventListener("message", messageReceived);
    });
}

/**
 * Get hover information from pyright
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format, `{ line: 0, character: 0 }`, where line and character are 0-indexed, unlike Monaco, which is 1-indexed
 * @returns {Promise<Object>} A promise that resolves to a hover object
 */
export function getHover(uri, position = { line: 0, character: 0 }) {
    // Convert the URI to the right URI format for pyright
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");

    // Store and increment the request ID
    const usedRequestId = requestId++;

    // Send the hover request to pyright
    pyrightWorker.postMessage({
        jsonrpc: '2.0',
        id: usedRequestId,
        method: 'textDocument/hover',
        params: {
            textDocument: { uri: uri },
            position: position,
            context: {
                triggerKind: 1
            }
        }
    });

    // Return a promise that resolves when the response is received
    return new Promise((resolve) => {
        function messageReceived(event) {
            // When a message is received, check if it's the response to this request
            const data = event.data;
            if (data.id === usedRequestId) {
                // If it is, resolve with the result
                resolve(data.result);

                // And remove this event listener
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        // Add an event listener for new messages from the worker
        pyrightWorker.addEventListener("message", messageReceived);
    });
}