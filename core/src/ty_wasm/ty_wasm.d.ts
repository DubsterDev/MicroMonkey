/* tslint:disable */
/* eslint-disable */
/**
 * Initializes the logger with the given log level.
 *
 * ## Panics
 * If this function is called more than once.
 */
export function initLogging(level: LogLevel): void;
export function run(): void;
export function version(): string;
export enum CompletionKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}
export enum DocumentHighlightKind {
  Text = 1,
  Read = 2,
  Write = 3,
}
export enum InlayHintKind {
  Type = 0,
  Parameter = 1,
}
export enum LogLevel {
  Trace = 0,
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
}
export enum PositionEncoding {
  Utf8 = 0,
  Utf16 = 1,
  Utf32 = 2,
}
export enum SemanticTokenKind {
  Namespace = 0,
  Class = 1,
  Parameter = 2,
  SelfParameter = 3,
  ClsParameter = 4,
  Variable = 5,
  Property = 6,
  Function = 7,
  Method = 8,
  Keyword = 9,
  String = 10,
  Number = 11,
  Decorator = 12,
  BuiltinConstant = 13,
  TypeParameter = 14,
}
export enum Severity {
  Info = 0,
  Warning = 1,
  Error = 2,
  Fatal = 3,
}
/**
 * A code action that can be applied to fix a diagnostic.
 */
export class CodeAction {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  title: string;
  edits: TextEdit[];
  preferred: boolean;
}
export class Completion {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  name: string;
  get kind(): CompletionKind | undefined;
  set kind(value: CompletionKind | null | undefined);
  get insert_text(): string | undefined;
  set insert_text(value: string | null | undefined);
  get additional_text_edits(): TextEdit[] | undefined;
  set additional_text_edits(value: TextEdit[] | null | undefined);
  get documentation(): string | undefined;
  set documentation(value: string | null | undefined);
  get detail(): string | undefined;
  set detail(value: string | null | undefined);
  get module_name(): string | undefined;
  set module_name(value: string | null | undefined);
}
export class Diagnostic {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  textRange(): TextRange | undefined;
  /**
   * Returns the code action for this diagnostic, if it has a fix.
   */
  codeAction(workspace: Workspace): CodeAction | undefined;
  id(): string;
  display(workspace: Workspace): string;
  message(): string;
  severity(): Severity;
  toRange(workspace: Workspace): Range | undefined;
}
export class DocumentHighlight {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly range: Range;
  readonly kind: DocumentHighlightKind;
}
export class FileHandle {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  [Symbol.dispose](): void;
  toString(): string;
  path(): string;
}
export class Hover {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  markdown: string;
  range: Range;
}
export class InlayHint {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  label: InlayHintLabelPart[];
  position: Position;
  kind: InlayHintKind;
  text_edits: TextEdit[];
}
export class InlayHintLabelPart {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  label: string;
  get location(): LocationLink | undefined;
  set location(value: LocationLink | null | undefined);
}
export class LocationLink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * The target file path
   */
  path: string;
  /**
   * The full range of the target
   */
  full_range: Range;
  /**
   * The target's range that should be selected/highlighted
   */
  get selection_range(): Range | undefined;
  /**
   * The target's range that should be selected/highlighted
   */
  set selection_range(value: Range | null | undefined);
  /**
   * The range of the origin.
   */
  get origin_selection_range(): Range | undefined;
  /**
   * The range of the origin.
   */
  set origin_selection_range(value: Range | null | undefined);
}
export class ParameterInformation {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  label: string;
  get documentation(): string | undefined;
  set documentation(value: string | null | undefined);
}
export class Position {
  free(): void;
  [Symbol.dispose](): void;
  constructor(line: number, column: number);
  /**
   * One indexed line number
   */
  line: number;
  /**
   * One indexed column number (the nth character on the line)
   */
  column: number;
}
export class Range {
  free(): void;
  [Symbol.dispose](): void;
  constructor(start: Position, end: Position);
  start: Position;
  end: Position;
}
export class SemanticToken {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static kinds(): string[];
  static modifiers(): string[];
  kind: SemanticTokenKind;
  modifiers: number;
  range: Range;
}
export class SignatureHelp {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  signatures: SignatureInformation[];
  get active_signature(): number | undefined;
  set active_signature(value: number | null | undefined);
}
export class SignatureInformation {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  label: string;
  get documentation(): string | undefined;
  set documentation(value: string | null | undefined);
  parameters: ParameterInformation[];
  get active_parameter(): number | undefined;
  set active_parameter(value: number | null | undefined);
}
export class TextEdit {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  range: Range;
  new_text: string;
}
export class TextRange {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  start: number;
  end: number;
}
export class Workspace {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Checks a single file.
   */
  checkFile(file_id: FileHandle): Diagnostic[];
  closeFile(file_id: FileHandle): void;
  completions(file_id: FileHandle, position: Position): Completion[];
  inlayHints(file_id: FileHandle, range: Range): InlayHint[];
  sourceText(file_id: FileHandle): string;
  updateFile(file_id: FileHandle, contents: string): void;
  codeActions(file_id: FileHandle, diagnostic: Diagnostic): CodeAction[] | undefined;
  signatureHelp(file_id: FileHandle, position: Position): SignatureHelp | undefined;
  updateOptions(options: any): void;
  gotoDefinition(file_id: FileHandle, position: Position): LocationLink[];
  gotoReferences(file_id: FileHandle, position: Position): LocationLink[];
  semanticTokens(file_id: FileHandle): SemanticToken[];
  gotoDeclaration(file_id: FileHandle, position: Position): LocationLink[];
  /**
   * Gets a file handle for a vendored file by its path.
   * This allows vendored files to participate in LSP features like hover, completions, etc.
   */
  getVendoredFile(path: string): FileHandle;
  documentHighlights(file_id: FileHandle, position: Position): DocumentHighlight[];
  gotoTypeDefinition(file_id: FileHandle, position: Position): LocationLink[];
  semanticTokensInRange(file_id: FileHandle, range: Range): SemanticToken[];
  constructor(root: string, position_encoding: PositionEncoding, options: any);
  /**
   * Checks all open files
   */
  check(): Diagnostic[];
  hover(file_id: FileHandle, position: Position): Hover | undefined;
  format(file_id: FileHandle): string | undefined;
  /**
   * Returns the parsed AST for `path`
   */
  parsed(file_id: FileHandle): string;
  /**
   * Returns the token stream for `path` serialized as a string.
   */
  tokens(file_id: FileHandle): string;
  openFile(path: string, contents: string): FileHandle;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_codeaction_free: (a: number, b: number) => void;
  readonly __wbg_completion_free: (a: number, b: number) => void;
  readonly __wbg_diagnostic_free: (a: number, b: number) => void;
  readonly __wbg_documenthighlight_free: (a: number, b: number) => void;
  readonly __wbg_filehandle_free: (a: number, b: number) => void;
  readonly __wbg_get_codeaction_edits: (a: number) => [number, number];
  readonly __wbg_get_codeaction_preferred: (a: number) => number;
  readonly __wbg_get_codeaction_title: (a: number) => [number, number];
  readonly __wbg_get_completion_additional_text_edits: (a: number) => [number, number];
  readonly __wbg_get_completion_detail: (a: number) => [number, number];
  readonly __wbg_get_completion_documentation: (a: number) => [number, number];
  readonly __wbg_get_completion_insert_text: (a: number) => [number, number];
  readonly __wbg_get_completion_kind: (a: number) => number;
  readonly __wbg_get_completion_module_name: (a: number) => [number, number];
  readonly __wbg_get_documenthighlight_kind: (a: number) => number;
  readonly __wbg_get_documenthighlight_range: (a: number) => number;
  readonly __wbg_get_hover_range: (a: number) => number;
  readonly __wbg_get_inlayhint_kind: (a: number) => number;
  readonly __wbg_get_inlayhint_label: (a: number) => [number, number];
  readonly __wbg_get_inlayhint_position: (a: number) => number;
  readonly __wbg_get_inlayhintlabelpart_label: (a: number) => [number, number];
  readonly __wbg_get_inlayhintlabelpart_location: (a: number) => number;
  readonly __wbg_get_locationlink_full_range: (a: number) => number;
  readonly __wbg_get_locationlink_origin_selection_range: (a: number) => number;
  readonly __wbg_get_locationlink_path: (a: number) => [number, number];
  readonly __wbg_get_locationlink_selection_range: (a: number) => number;
  readonly __wbg_get_position_column: (a: number) => number;
  readonly __wbg_get_position_line: (a: number) => number;
  readonly __wbg_get_range_end: (a: number) => number;
  readonly __wbg_get_range_start: (a: number) => number;
  readonly __wbg_get_semantictoken_kind: (a: number) => number;
  readonly __wbg_get_semantictoken_range: (a: number) => number;
  readonly __wbg_get_signaturehelp_active_signature: (a: number) => number;
  readonly __wbg_get_signaturehelp_signatures: (a: number) => [number, number];
  readonly __wbg_get_signatureinformation_documentation: (a: number) => [number, number];
  readonly __wbg_get_signatureinformation_label: (a: number) => [number, number];
  readonly __wbg_get_signatureinformation_parameters: (a: number) => [number, number];
  readonly __wbg_hover_free: (a: number, b: number) => void;
  readonly __wbg_inlayhint_free: (a: number, b: number) => void;
  readonly __wbg_inlayhintlabelpart_free: (a: number, b: number) => void;
  readonly __wbg_locationlink_free: (a: number, b: number) => void;
  readonly __wbg_parameterinformation_free: (a: number, b: number) => void;
  readonly __wbg_position_free: (a: number, b: number) => void;
  readonly __wbg_range_free: (a: number, b: number) => void;
  readonly __wbg_semantictoken_free: (a: number, b: number) => void;
  readonly __wbg_set_codeaction_edits: (a: number, b: number, c: number) => void;
  readonly __wbg_set_codeaction_preferred: (a: number, b: number) => void;
  readonly __wbg_set_codeaction_title: (a: number, b: number, c: number) => void;
  readonly __wbg_set_completion_additional_text_edits: (a: number, b: number, c: number) => void;
  readonly __wbg_set_completion_detail: (a: number, b: number, c: number) => void;
  readonly __wbg_set_completion_documentation: (a: number, b: number, c: number) => void;
  readonly __wbg_set_completion_insert_text: (a: number, b: number, c: number) => void;
  readonly __wbg_set_completion_kind: (a: number, b: number) => void;
  readonly __wbg_set_completion_module_name: (a: number, b: number, c: number) => void;
  readonly __wbg_set_hover_range: (a: number, b: number) => void;
  readonly __wbg_set_inlayhint_kind: (a: number, b: number) => void;
  readonly __wbg_set_inlayhint_label: (a: number, b: number, c: number) => void;
  readonly __wbg_set_inlayhint_position: (a: number, b: number) => void;
  readonly __wbg_set_inlayhintlabelpart_label: (a: number, b: number, c: number) => void;
  readonly __wbg_set_inlayhintlabelpart_location: (a: number, b: number) => void;
  readonly __wbg_set_locationlink_full_range: (a: number, b: number) => void;
  readonly __wbg_set_locationlink_origin_selection_range: (a: number, b: number) => void;
  readonly __wbg_set_locationlink_path: (a: number, b: number, c: number) => void;
  readonly __wbg_set_locationlink_selection_range: (a: number, b: number) => void;
  readonly __wbg_set_position_column: (a: number, b: number) => void;
  readonly __wbg_set_position_line: (a: number, b: number) => void;
  readonly __wbg_set_range_end: (a: number, b: number) => void;
  readonly __wbg_set_range_start: (a: number, b: number) => void;
  readonly __wbg_set_semantictoken_kind: (a: number, b: number) => void;
  readonly __wbg_set_semantictoken_range: (a: number, b: number) => void;
  readonly __wbg_set_signaturehelp_active_signature: (a: number, b: number) => void;
  readonly __wbg_set_signaturehelp_signatures: (a: number, b: number, c: number) => void;
  readonly __wbg_set_signatureinformation_documentation: (a: number, b: number, c: number) => void;
  readonly __wbg_set_signatureinformation_label: (a: number, b: number, c: number) => void;
  readonly __wbg_set_signatureinformation_parameters: (a: number, b: number, c: number) => void;
  readonly __wbg_signaturehelp_free: (a: number, b: number) => void;
  readonly __wbg_signatureinformation_free: (a: number, b: number) => void;
  readonly __wbg_textedit_free: (a: number, b: number) => void;
  readonly __wbg_textrange_free: (a: number, b: number) => void;
  readonly __wbg_workspace_free: (a: number, b: number) => void;
  readonly diagnostic_codeAction: (a: number, b: number) => number;
  readonly diagnostic_display: (a: number, b: number) => any;
  readonly diagnostic_id: (a: number) => any;
  readonly diagnostic_message: (a: number) => any;
  readonly diagnostic_severity: (a: number) => number;
  readonly diagnostic_textRange: (a: number) => number;
  readonly diagnostic_toRange: (a: number, b: number) => number;
  readonly filehandle_path: (a: number) => [number, number];
  readonly filehandle_toString: (a: number) => [number, number];
  readonly initLogging: (a: number) => void;
  readonly range_new: (a: number, b: number) => number;
  readonly run: () => void;
  readonly semantictoken_kinds: () => [number, number];
  readonly semantictoken_modifiers: () => [number, number];
  readonly version: () => [number, number];
  readonly workspace_check: (a: number) => [number, number, number, number];
  readonly workspace_checkFile: (a: number, b: number) => [number, number, number, number];
  readonly workspace_closeFile: (a: number, b: number) => [number, number];
  readonly workspace_codeActions: (a: number, b: number, c: number) => [number, number];
  readonly workspace_completions: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_documentHighlights: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_format: (a: number, b: number) => [number, number, number, number];
  readonly workspace_getVendoredFile: (a: number, b: number, c: number) => [number, number, number];
  readonly workspace_gotoDeclaration: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_gotoDefinition: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_gotoReferences: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_gotoTypeDefinition: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_hover: (a: number, b: number, c: number) => [number, number, number];
  readonly workspace_inlayHints: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_new: (a: number, b: number, c: number, d: any) => [number, number, number];
  readonly workspace_openFile: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly workspace_parsed: (a: number, b: number) => [number, number, number, number];
  readonly workspace_semanticTokens: (a: number, b: number) => [number, number, number, number];
  readonly workspace_semanticTokensInRange: (a: number, b: number, c: number) => [number, number, number, number];
  readonly workspace_signatureHelp: (a: number, b: number, c: number) => [number, number, number];
  readonly workspace_sourceText: (a: number, b: number) => [number, number, number, number];
  readonly workspace_tokens: (a: number, b: number) => [number, number, number, number];
  readonly workspace_updateFile: (a: number, b: number, c: number, d: number) => [number, number];
  readonly workspace_updateOptions: (a: number, b: any) => [number, number];
  readonly __wbg_set_semantictoken_modifiers: (a: number, b: number) => void;
  readonly __wbg_set_textrange_end: (a: number, b: number) => void;
  readonly __wbg_set_textrange_start: (a: number, b: number) => void;
  readonly __wbg_get_completion_name: (a: number) => [number, number];
  readonly __wbg_get_hover_markdown: (a: number) => [number, number];
  readonly __wbg_get_parameterinformation_label: (a: number) => [number, number];
  readonly __wbg_get_textedit_new_text: (a: number) => [number, number];
  readonly __wbg_get_signatureinformation_active_parameter: (a: number) => number;
  readonly __wbg_get_textedit_range: (a: number) => number;
  readonly __wbg_get_parameterinformation_documentation: (a: number) => [number, number];
  readonly __wbg_set_completion_name: (a: number, b: number, c: number) => void;
  readonly __wbg_set_hover_markdown: (a: number, b: number, c: number) => void;
  readonly __wbg_set_parameterinformation_label: (a: number, b: number, c: number) => void;
  readonly __wbg_set_textedit_new_text: (a: number, b: number, c: number) => void;
  readonly __wbg_set_parameterinformation_documentation: (a: number, b: number, c: number) => void;
  readonly __wbg_set_inlayhint_text_edits: (a: number, b: number, c: number) => void;
  readonly __wbg_set_signatureinformation_active_parameter: (a: number, b: number) => void;
  readonly __wbg_set_textedit_range: (a: number, b: number) => void;
  readonly position_new: (a: number, b: number) => number;
  readonly __wbg_get_semantictoken_modifiers: (a: number) => number;
  readonly __wbg_get_textrange_end: (a: number) => number;
  readonly __wbg_get_textrange_start: (a: number) => number;
  readonly __wbg_get_inlayhint_text_edits: (a: number) => [number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
