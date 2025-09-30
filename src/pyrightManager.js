import { updateDiagnostics } from "./editor";
import stubs from "./stub-bundle.json";

const pyrightWorker = new Worker("pyright/pyright.worker.js");
pyrightWorker.addEventListener("message", (event) => {
    const data = event.data;
    if (data.method === "textDocument/publishDiagnostics") {
        updateDiagnostics(data.params.diagnostics, data.params.uri.replaceAll("/" + encodeURIComponent("<default workspace root>") + "/", "micromonkey/"));
    } else if (data.method === "window/logMessage") {
        console.log("pyright message", data.params.message);
    }
})

window.addEventListener("beforeunload", () => {
    pyrightWorker.terminate();
})

let requestId = 0;

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

const fileVersions = {};

let currentlyOpenUri = "";
export function openFile(uri, content) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    fileVersions[uri] = 1;
    if (currentlyOpenUri !== "") closeFile(currentlyOpenUri);
    const didOpen = {
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
    };

    pyrightWorker.postMessage(didOpen);

    currentlyOpenUri = uri;
}

export function closeFile(uri) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    const didClose = {
        jsonrpc: '2.0',
        method: 'textDocument/didClose',
        params: {
            textDocument: {
                uri: uri
            },
        },
    };

    pyrightWorker.postMessage(didClose);
}

export function updateFile(uri, changes) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    const didChange = {
        jsonrpc: '2.0',
        method: 'textDocument/didChange',
        params: {
            textDocument: {
                uri: uri,
                version: fileVersions[uri]++,
            },
            contentChanges: changes,
        },
    };

    pyrightWorker.postMessage(didChange);
}

export function getCompletions(uri, position = { line: 0, character: 0 }) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    const usedRequestId = requestId;
    const message = {
        jsonrpc: '2.0',
        id: usedRequestId,
        method: 'textDocument/completion',
        params: {
            textDocument: { uri: uri },
            position: position,
            context: { triggerKind: 1 }
        },
    };
    requestId++;

    pyrightWorker.postMessage(message);
    return new Promise((resolve) => {
        function messageReceived(event) {
            const data = event.data;
            if (data.id === usedRequestId) {
                resolve(data.result);
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        pyrightWorker.addEventListener("message", messageReceived);
    });
}

export function getSignatureHelp(uri, position = { line: 0, character: 0 }) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    const usedRequestId = requestId;
    const message = {
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
    };
    requestId++;

    pyrightWorker.postMessage(message);

    return new Promise((resolve) => {
        function messageReceived(event) {
            const data = event.data;
            if (data.id === usedRequestId) {
                resolve(data.result);
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        pyrightWorker.addEventListener("message", messageReceived);
    });
}

export function getHover(uri, position = { line: 0, character: 0 }) {
    uri = uri.replaceAll("micromonkey/", "/<default workspace root>/");
    const usedRequestId = requestId;
    const message = {
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
    };
    requestId++;

    pyrightWorker.postMessage(message);

    return new Promise((resolve) => {
        function messageReceived(event) {
            const data = event.data;
            if (data.id === usedRequestId) {
                resolve(data.result);
                pyrightWorker.removeEventListener("message", messageReceived);
            }
        }

        pyrightWorker.addEventListener("message", messageReceived);
    });
}