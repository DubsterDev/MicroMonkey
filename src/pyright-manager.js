import stubs from "./stub-bundle.json";

const pyrightWorker = new Worker("pyright/pyright.worker.js");

let requestId = 0;


stubs["pyrightconfig.json"] = {
    "typeCheckingMode": "strict",
    "typeshedPath": "/typeshed"
}
pyrightWorker.postMessage({
    jsonrpc: '2.0',
    id: requestId++,
    method: 'initialize',
    params: {
        rootUri: 'file://micromonkey',
        capabilities: {},
        initializationOptions: {
            files: stubs
        }
    }
});

const fileVersions = {};

let currentlyOpenUri = "";
function openFile(uri, content) {
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

function closeFile(uri) {
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

function updateFile(uri, changes) {
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

function getCompletions(uri, position = { line: 0, character: 0 }) {
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

function getSignatureHelp(uri, position = { line: 0, character: 0 }) {
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

export { openFile, closeFile, updateFile, getCompletions, getSignatureHelp };