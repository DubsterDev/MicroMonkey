// Import dependencies
import * as monaco from "monaco-editor";
import { openFile, updateFile, getCompletions, getSignatureHelp, getHover } from "./pyright-manager";
import { fileChanged } from "./openFilesManager";
import { getSetting } from "./settings";

// Create editor variable so we can access it later
let editor;

/**
 * Sets up the monaco editor instance. Must be called before any other functions here.
 * @returns {*} Instance of monaco
 */
export function setUpMonaco() {
    // Define MonacoEnviroment so it gets the service worker from the right spot
    self.MonacoEnvironment = {
        getWorker: function (_moduleId, label) {
            return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
                type: 'module'
            });
        }
    };

    // Create an editor instance
    editor = monaco.editor.create(document.getElementById('codeEditor'), {
        value: ['print("Hello")'].join('\n'),
        language: 'python',
        theme: 'matchMedia' in window && matchMedia("(prefers-color-scheme: light)").matches ? "vs-light" : "vs-dark",
        automaticLayout: true
    });

    // Dynamically change the theme of the editor based on the system theme
    if ('matchMedia' in window) {
        matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
            monaco.editor.setTheme(event.matches ? "vs-light" : "vs-dark");
        });
    }

    // Register python completion provider
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: async (model, position) => {
            // Array mapping from what the Language Server returns and what Monaco expects
            const lspToMonacoKind = {
                1: monaco.languages.CompletionItemKind.Text,
                2: monaco.languages.CompletionItemKind.Method,
                3: monaco.languages.CompletionItemKind.Function,
                4: monaco.languages.CompletionItemKind.Constructor,
                5: monaco.languages.CompletionItemKind.Field,
                6: monaco.languages.CompletionItemKind.Variable,
                7: monaco.languages.CompletionItemKind.Class,
                8: monaco.languages.CompletionItemKind.Interface,
                9: monaco.languages.CompletionItemKind.Module,
                10: monaco.languages.CompletionItemKind.Property,
                11: monaco.languages.CompletionItemKind.Unit,
                12: monaco.languages.CompletionItemKind.Value,
                13: monaco.languages.CompletionItemKind.Enum,
                14: monaco.languages.CompletionItemKind.Keyword,
                15: monaco.languages.CompletionItemKind.Snippet,
                16: monaco.languages.CompletionItemKind.Color,
                17: monaco.languages.CompletionItemKind.File,
                18: monaco.languages.CompletionItemKind.Reference,
                19: monaco.languages.CompletionItemKind.Folder,
                20: monaco.languages.CompletionItemKind.EnumMember,
                21: monaco.languages.CompletionItemKind.Constant,
                22: monaco.languages.CompletionItemKind.Struct,
                23: monaco.languages.CompletionItemKind.Event,
                24: monaco.languages.CompletionItemKind.Operator,
                25: monaco.languages.CompletionItemKind.TypeParameter,
            };

            // Get completions from pyright
            const completions = await getCompletions(model.uri.toString(), {
                line: position.lineNumber - 1,
                character: position.column - 1
            });

            // Make sure result is an array
            const items = Array.isArray(completions)
                ? completions
                : completions.items;

            // Map suggestions to a monaco style array
            const suggestions = items.map((item) => ({
                label: item.label,
                kind: lspToMonacoKind[item.kind] ?? monaco.languages.CompletionItemKind.Text,
                insertText: item.insertText || item.label,
                detail: item.detail,
                documentation: item.documentation,
                sortText: item.sortText,
            }));

            return { suggestions };
        }
    });

    // Register a python signature help provider
    monaco.languages.registerSignatureHelpProvider('python', {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: async function (model, position) {
            // Convert the URI to a string
            const uri = model.uri.toString();

            // Get signature help from pyright
            const result = await getSignatureHelp(uri, {
                line: position.lineNumber - 1,
                character: position.column - 1,
            });

            // If there are no results, return no results
            if (!result || !result.signatures?.length) return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => { } };

            // Convert signatures from LSP style to monaco style
            const signatures = result.signatures.map((sig) => ({
                label: sig.label,
                documentation: sig.documentation,
                parameters: sig.parameters?.map((param) => ({
                    label: param.label,
                    documentation: param.documentation
                })) ?? [],
            }));

            // Return signatures to Monaco
            return {
                value: {
                    signatures,
                    activeSignature: result.activeSignature ?? 0,
                    activeParameter: result.activeParameter ?? 0
                },
                dispose: () => { }
            };
        }
    });

    // Register a hover provider
    monaco.languages.registerHoverProvider('python', {
        provideHover: async function (model, position, token) {
            // Get the result of hovering
            const hoverResult = await getHover(model.uri.toString(), {
                line: position.lineNumber - 1,
                character: position.column - 1,
            });
            
            // Return the result to Monaco
            return {
                contents: [
                    {
                        value: hoverResult.contents.value,
                        supportHtml: false,
                        isTrusted: false
                    }
                ],
                range: {
                    endColumn: hoverResult.range.end.character + 1,
                    endLineNumber: hoverResult.range.end.line + 1,
                    startColumn: hoverResult.range.start.character + 1,
                    startLineNumber: hoverResult.range.start.line + 1
                }
            };
        }
    })

    // Return an editor instance in case it is needed elsewhere
    return editor;
}

/**
 * Get a model for a file
 * @param {string} content Contents of the file
 * @param {string} uri URI for the model. Should start with file://micromonkey/
 * @returns The monaco model
 */
export function createModel(content, uri) {
    // Create the model
    const model = monaco.editor.createModel(
        content,
        'python',
        monaco.Uri.parse(uri)
    );

    // Return the model
    return model;
}

/**
 * Switch what model is displaying in the editor
 * @param {*} model The model to switch to. You can get one of these with {@link createModel}
 */
export function changeModel(model) {
    // Set the size of the editor to make sure it's right
    const serialMonitor = document.getElementById("serialMonitor");
    const rightPanel = document.getElementById("rightPanel");
    editor.layout({
        width: rightPanel.clientWidth,
        height: rightPanel.clientHeight - serialMonitor.clientHeight - document.getElementById("tabs").clientHeight
    });

    // Convert the URI to a string
    const modelUriString = model.uri.toString();

    // Convert the model URI to an actual path on the board
    const modelPath = modelUriString.replace("file://micromonkey", "");

    // Set the model
    editor.setModel(model);

    // Remove any diagnostics that are applied to this editor
    // if syntax checking is disabled
    if (!getSetting("syntax-checking")) monaco.editor.setModelMarkers(model, "pyright", []);

    // Let pyright know we're using a different file
    openFile(modelUriString, model.getValue());

    // Add a listener for when the user types in the code editor
    model.onDidChangeContent((e) => {
        // Get the changes to the file
        const changes = [{
            text: model.getValue()
        }];

        // Let file manager know that the file has changed
        fileChanged(modelPath);

        // Tell pyright the file has changed
        updateFile(modelUriString, changes);
    })
}

/**
 * Updates the syntax highlighting markers displayed in the editor.
 * @param {Array} diagnostics An array of Language Server Protocol style diagnostics
 * @param {string} uri The URI the diagnostics are for
 */
export function updateDiagnostics(diagnostics, uri) {
    // Don't show diagnostics if they're disabled
    if (!getSetting("syntax-checking")) return;

    // An array of monaco marker types to convert LSP to Monaco
    const monacoMarkerType = [
        undefined,
        monaco.MarkerSeverity.Error,
        monaco.MarkerSeverity.Warning,
        monaco.MarkerSeverity.Info,
        monaco.MarkerSeverity.Hint
    ];

    // A list of diagnostic codes to ingore
    const ignoreDiagnostics = [
        "reportMissingImports",
        "reportMissingModuleSource",
        "reportGeneralTypeIssues",
        "reportReturnType",
        "reportUnknownParameterType",
        "reportUnknownArgumentType",
        "reportUnknownLambdaType",
        "reportUnknownVariableType",
        "reportUnknownMemberType",
        "reportMissingParameterType",
        "reportMissingTypeArgument"
    ];

    // An array containing the diagnostics for Monaco
    const newDiagnostics = [];

    // Loop through the array of diagnostics
    diagnostics.forEach(diagnostic => {
        // Skip it if it is a missing module source or unknown module
        if (ignoreDiagnostics.includes(diagnostic.code)) return;
        // Create a Monaco style diagnostic
        const newDiagnostic = {
            endColumn: diagnostic.range.end.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            message: diagnostic.message,
            source: diagnostic.source,
            severity: monacoMarkerType[diagnostic.severity],
            startColumn: diagnostic.range.start.character + 1,
            startLineNumber: diagnostic.range.start.line + 1,
            code: diagnostic.code
        };

        // Push the new diagnostic to the array
        newDiagnostics.push(newDiagnostic);
    });

    // Update Monaco with the new diagnostics
    monaco.editor.setModelMarkers(monaco.editor.getModel(uri), "pyright", newDiagnostics);
}