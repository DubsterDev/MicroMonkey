// Import dependencies
import * as monaco from "monaco-editor";
import { fileChanged } from "./openFilesManager";
import { getSetting } from "./settings";
import { getCompletions, getHover, getSignatureHelp, initializeTy, openFile, updateFile } from "./tyManager";
import { CompletionKind, Severity } from "./ty_wasm/ty_wasm";

// Create editor variable so we can access it later
let editor;
let diffEditor;

/**
 * Sets up the monaco editor instance. Must be called before any other functions here.
 * @returns {*} Instance of monaco
 */
export function setUpMonaco() {
    // Start ty
    initializeTy(updateDiagnostics);

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
        automaticLayout: true,
        fixedOverflowWidgets: true
    });
    diffEditor = monaco.editor.createDiffEditor(document.getElementById('codeDiffEditor'), {
        value: ['print("Hello")'].join('\n'),
        language: 'python',
        theme: 'matchMedia' in window && matchMedia("(prefers-color-scheme: light)").matches ? "vs-light" : "vs-dark",
        automaticLayout: true,
        fixedOverflowWidgets: true,
        readOnly: true
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
            // Array mapping from what ty returns and what Monaco expects
            const tyToMonacoKind = {
                [CompletionKind.Text]: monaco.languages.CompletionItemKind.Text,
                [CompletionKind.Method]: monaco.languages.CompletionItemKind.Method,
                [CompletionKind.Function]: monaco.languages.CompletionItemKind.Function,
                [CompletionKind.Constructor]: monaco.languages.CompletionItemKind.Constructor,
                [CompletionKind.Field]: monaco.languages.CompletionItemKind.Field,
                [CompletionKind.Variable]: monaco.languages.CompletionItemKind.Variable,
                [CompletionKind.Class]: monaco.languages.CompletionItemKind.Class,
                [CompletionKind.Interface]: monaco.languages.CompletionItemKind.Interface,
                [CompletionKind.Module]: monaco.languages.CompletionItemKind.Module,
                [CompletionKind.Property]: monaco.languages.CompletionItemKind.Property,
                [CompletionKind.Unit]: monaco.languages.CompletionItemKind.Unit,
                [CompletionKind.Value]: monaco.languages.CompletionItemKind.Value,
                [CompletionKind.Enum]: monaco.languages.CompletionItemKind.Enum,
                [CompletionKind.Keyword]: monaco.languages.CompletionItemKind.Keyword,
                [CompletionKind.Snippet]: monaco.languages.CompletionItemKind.Snippet,
                [CompletionKind.Color]: monaco.languages.CompletionItemKind.Color,
                [CompletionKind.File]: monaco.languages.CompletionItemKind.File,
                [CompletionKind.Reference]: monaco.languages.CompletionItemKind.Reference,
                [CompletionKind.Folder]: monaco.languages.CompletionItemKind.Folder,
                [CompletionKind.EnumMember]: monaco.languages.CompletionItemKind.EnumMember,
                [CompletionKind.Constant]: monaco.languages.CompletionItemKind.Constant,
                [CompletionKind.Struct]: monaco.languages.CompletionItemKind.Struct,
                [CompletionKind.Event]: monaco.languages.CompletionItemKind.Event,
                [CompletionKind.Operator]: monaco.languages.CompletionItemKind.Operator,
                [CompletionKind.TypeParameter]: monaco.languages.CompletionItemKind.TypeParameter,
            };

            // Get completions from ty
            const completions = await getCompletions(model.uri.toString(), {
                line: position.lineNumber,
                column: position.column
            });

            // Map suggestions to a monaco style array
            const suggestions = completions.map((item) => ({
                label: item.name,
                kind: tyToMonacoKind[item.kind] ?? monaco.languages.CompletionItemKind.Text,
                insertText: item.insert_text || item.name,
                detail: item.detail,
                documentation: item.documentation,
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

            // Get signature help from ty
            const result = await getSignatureHelp(uri, {
                line: position.lineNumber,
                column: position.column,
            });
            window.signatureHelp = result;

            // If there are no results, return no results
            if (!result || !result.signatures?.length) return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => { } };

            // Convert signatures from ty style to monaco style
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
                    activeSignature: result.active_signature ?? 0,
                    activeParameter: result.signatures[result.active_signature].active_parameter ?? 0
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
                line: position.lineNumber,
                column: position.column,
            });

            if (!hoverResult) return;

            // Return the result to Monaco
            return {
                contents: [
                    {
                        value: hoverResult.markdown,
                        supportHtml: true,
                        isTrusted: true
                    }
                ],
                range: {
                    endColumn: hoverResult.range.end.column,
                    endLineNumber: hoverResult.range.end.line,
                    startColumn: hoverResult.range.start.column,
                    startLineNumber: hoverResult.range.start.line
                }
            };
        }
    })

    // Return an editor instance in case it is needed elsewhere
    return [editor, diffEditor];
}

/**
 * Get a model for a file
 * @param {string} content Contents of the file
 * @param {string} uri URI for the model. Should start with file://micromonkey/
 * @param {string} language Language of the file, defaults to python
 * @returns The monaco model
 */
export function createModel(content, uri, language = "python") {
    // Create the model
    const model = monaco.editor.createModel(
        content,
        language,
        monaco.Uri.parse(uri)
    );

    // Return the model
    return model;
}

/**
 * Switch what model is displaying in the editor
 * @param {*} model The model to switch to. You can get one of these with {@link createModel}
 * @param {*} [originalModel=null] The original model. Only needed for the diff editor.
 */
export function changeModel(model, originalModel=null) {
    // Convert the URI to a string
    const modelUriString = model.uri.toString();

    // Convert the model URI to an actual path on the board
    const modelPath = modelUriString.replace("file://micromonkey", "");

    // Set the model
    if (originalModel) diffEditor.setModel({
        original: originalModel,
        modified: model
    })
    else editor.setModel(model);

    // Remove any diagnostics that are applied to this editor
    // if syntax checking is disabled
    if (!getSetting("syntax-checking")) monaco.editor.setModelMarkers(model, "ty", []);

    // Add a listener for when the user types in the code editor
    model.onDidChangeContent((e) => {
        // Let file manager know that the file has changed
        fileChanged(modelPath);

        // Tell ty the file has changed
        updateFile(modelUriString, model.getValue());
    })
}

/**
 * Updates the syntax highlighting markers displayed in the editor.
 * @param {Array} diagnostics An array of Language Server Protocol style diagnostics
 * @param {string} uri The URI the diagnostics are for
 */
export function updateDiagnostics(uri, diagnostics) {
    window.diags = diagnostics;
    // Don't show diagnostics if they're disabled
    if (!getSetting("syntax-checking")) return;

    // Get the monaco model
    const model = monaco.editor.getModel(uri);

    // Return if monaco model is undefined/null
    if (model === undefined || model === null) return;

    // If the language of the model is not python, don't render the diagnostics
    if (model.getLanguageId() !== "python") return;

    // An array of monaco marker types to convert ty to Monaco
    const monacoMarkerType = {
        [Severity.Fatal]: monaco.MarkerSeverity.Error,
        [Severity.Error]: monaco.MarkerSeverity.Error,
        [Severity.Warning]: monaco.MarkerSeverity.Warning,
        [Severity.Info]: monaco.MarkerSeverity.Info,
    };

    // A list of diagnostic codes to ingore
    const ignoreDiagnostics = [
        "unresolved-import"
    ];

    // An array containing the diagnostics for Monaco
    const newDiagnostics = [];

    // Loop through the array of diagnostics
    diagnostics.forEach(diagnostic => {
        // Skip it if it is a missing module source or unknown module
        if (ignoreDiagnostics.includes(diagnostic.diagnostic.id())) return;

        // Create a Monaco style diagnostic
        const newDiagnostic = {
            endColumn: diagnostic.range.end.column,
            endLineNumber: diagnostic.range.end.line,
            message: diagnostic.diagnostic.message(),
            source: "ty",
            severity: monacoMarkerType[diagnostic.diagnostic.severity()],
            startColumn: diagnostic.range.start.column,
            startLineNumber: diagnostic.range.start.line,
            code: diagnostic.diagnostic.id()
        };

        // Push the new diagnostic to the array
        newDiagnostics.push(newDiagnostic);
    });

    // Update Monaco with the new diagnostics
    monaco.editor.setModelMarkers(model, "ty", newDiagnostics);
}