import * as monaco from "monaco-editor";
import { openFile, updateFile, getCompletions, getSignatureHelp } from "./pyright-manager";
import { fileChanged } from "./openFilesManager";

let editor;
export function setUpMonaco() {
    self.MonacoEnvironment = {
        getWorker: function (_moduleId, label) {
            return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
                type: 'module'
            });
        }
    };

    editor = monaco.editor.create(document.getElementById('codeEditor'), {
        value: ['print("Hello")'].join('\n'),
        language: 'python',
        theme: "vs-dark",
        automaticLayout: true
    });

    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: async (model, position) => {
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
            console.log(position)

            const completions = await getCompletions(model.uri.toString(), {
                line: position.lineNumber - 1,
                character: position.column - 1
            });

            const items = Array.isArray(completions)
                ? completions
                : completions.items;
            console.log(items)

            const suggestions = items.map((item) => ({
                label: item.label,
                kind: lspToMonacoKind[item.kind] ?? monaco.languages.CompletionItemKind.Text,
                insertText: item.insertText || item.label,
                detail: item.detail,
                documentation: item.documentation,
                sortText: item.sortText,
            }));
            console.log(suggestions)
            return { suggestions };
        }
    });

    monaco.languages.registerSignatureHelpProvider('python', {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: async function (model, position) {
            const uri = model.uri.toString();

            const result = await getSignatureHelp(uri, {
                line: position.lineNumber - 1,
                character: position.column - 1,
            });

            if (!result || !result.signatures?.length) return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose: () => { } };

            const signatures = result.signatures.map((sig) => ({
                label: sig.label,
                documentation: sig.documentation,
                parameters: sig.parameters?.map((param) => ({
                    label: param.label,
                    documentation: param.documentation
                })) ?? [],
            }));

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
    return editor;
}

export function createModel(content, uri) {
    const model = monaco.editor.createModel(
        content,
        'python',
        monaco.Uri.parse(uri)
    );
    return model;
}

export function changeModel(model) {
    editor.setModel(model);

    openFile(model.uri.toString(), model.getValue());

    model.onDidChangeContent((e) => {
        const changes = e.changes.map((change) => {
            const startPos = model.getPositionAt(change.rangeOffset);
            const endPos = model.getPositionAt(change.rangeOffset + change.rangeLength);

            return {
                range: {
                    start: {
                        line: startPos.lineNumber - 1,
                        character: startPos.column - 1,
                    },
                    end: {
                        line: endPos.lineNumber - 1,
                        character: endPos.column - 1,
                    },
                },
                text: change.text,
            };
        });
        updateFile(model.uri.toString(), changes);
    })
}

export function getCurrentFileContent(editor) {

}