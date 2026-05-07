// Import functions from ty_wasm
import init, { LogLevel, PositionEncoding, Workspace, initLogging, Position } from "./ty_wasm/ty_wasm.js";

// Define some empty variables
let workspace;
let onDiagnosticsChanged;
let diagnosticsDebouncer;
const files = {};

/**
 * Initializes ty. Must be called before anything else in this file is called.
 * @param {Function} diagnosticsCallback When ty does diagnostics, this callback will be called with two parameters: the uri and the array of diagnostics.
 */
export async function initializeTy(diagnosticsCallback) {
    // Sets the callback
    onDiagnosticsChanged = diagnosticsCallback;

    // Initialize ty
    await init({module_or_path: "ty_wasm_bg.wasm"});

    // Set the log level
    initLogging(LogLevel.Warn);

    // Create workspace
    workspace = new Workspace("/", PositionEncoding.Utf16, {});
}

/**
 * Opens a new file
 * @param {string} uri The URI of the file
 * @param {string} content The contents of the file
 */
export async function openFile(uri, content) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Open the file and store the handle
    files[uri] = await workspace.openFile(uri, content);

    // Run diagnostics
    runDiagnostics(uri);
}

/**
 * Closes a file
 * @param {string} uri The URI of the file
 */
export async function closeFile(uri) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Close the file
    await workspace.closeFile(files[uri]);
    
    // Remove the handle
    delete files[uri];
}

/**
 * Closes all files
 */
export async function closeAllFiles() {
    for (const key in files) {
        await closeFile(key);
    }
}
 
/**
 * Update the contents of a file
 * @param {string} uri The URI of the file
 * @param {string} content The new contents of the file
 */
export async function updateFile(uri, content) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Send the update to ty
    await workspace.updateFile(files[uri], content);

    // Clear the diagnostics debouncer timeout
    clearTimeout(diagnosticsDebouncer);

    // Set a new debouncer timeout
    diagnosticsDebouncer = setTimeout(() => runDiagnostics(uri), 300);
}

/**
 * Get autocompletions from ty
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format: `{line: 1, column: 1}`
 * @returns Array of completions from ty
 */
export async function getCompletions(uri, position) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Get the completions from ty and return them.
    return workspace.completions(files[uri], new Position(position.line, position.column));
}

/**
 * Get signature help from ty
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format: `{line: 1, column: 1}`
 * @returns Signature help from ty
 */
export async function getSignatureHelp(uri, position) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Get the signature help from ty and return it.
    return workspace.signatureHelp(files[uri], new Position(position.line, position.column));
}

/**
 * Gets hover information from ty
 * @param {string} uri The URI of the file
 * @param {object} position The position of the cursor in the format: `{line: 1, column: 1}`
 * @returns Hover information from ty
 */
export async function getHover(uri, position) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Get the hover info from ty and return it;
    return workspace.hover(files[uri], new Position(position.line, position.column));
}

/**
 * Run diagnostics on a specified file.
 * @param {string} uri The URI of the file
 */
async function runDiagnostics(uri) {
    // Convert the URI to a file path
    uri = uriToPath(uri);

    // Get the diagnostics from ty
    const diagnostics = workspace.checkFile(files[uri]).map(diagnostic => {
        // Map it so we can have the range too
        return {
            range: diagnostic.toRange(workspace),
            diagnostic: diagnostic
        }
    });

    // Call the callback
    if (onDiagnosticsChanged) onDiagnosticsChanged(pathToUri(uri), diagnostics);
}

/**
 * Convert a Monaco URI to a ty path
 * @param {string} uri The URI to convert to a path
 * @returns {string} The converted path
 */
function uriToPath(uri) {
    return uri.replace("file://micromonkey/", "/");
}


/**
 * Convert a ty path to a Monaco URI
 * @param {string} path The path to convert to a URI
 * @returns {string} The converted URI
 */
function pathToUri(path) {
    return path.replace("/", "file://micromonkey/");
}