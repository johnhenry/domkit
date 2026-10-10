// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** An editable code field with syntax highlighting (JavaScript, CSS, HTML),
 * built on a real `<textarea>`: form-associated, with a textarea's value,
 * selection API, and events, plus indent/outdent, auto-indent, and
 * auto-closed brackets and quotes that all keep native undo working. */
export default class CodeEditor extends HTMLElement {
  /** The current text. Setting it replaces the text (and, as for a textarea,
   * clears the browser's undo history). Script changes don't fire events. */
  value: string;
  /** The value `form.reset()` restores: the `value` attribute if present,
   * else the initial text content. Setting it sets the `value` attribute. */
  defaultValue: string;
  /** Length of the value, like a textarea's. */
  readonly textLength: number;
  /** "textarea", like a textarea's (for code that branches on `type`). */
  readonly type: string;
  /** The language in effect: `js`, `css`, `html`, or null if unrecognized. */
  readonly resolvedLanguage: string | null;
  language: string;
  name: string;
  placeholder: string;
  disabled: boolean;
  /** Mirrors the `readonly` attribute. */
  readOnly: boolean;
  required: boolean;
  /** Spaces per indent level (default 2). */
  tabSize: number;
  /** Minimum height in lines (default 2, like a textarea). */
  rows: number;
  /** Reflects the `wrap` attribute as written ("" when absent), like a
   * textarea's. Long lines wrap unless it is `off`. */
  wrap: string;
  /** Mirrors the `maxlength` attribute; -1 when absent, like a textarea's. */
  maxLength: number;
  /** Mirrors the `minlength` attribute; -1 when absent, like a textarea's. */
  minLength: number;
  /** Mirrors the `autocomplete` attribute. */
  autocomplete: string;
  /** Mirrors the `no-auto-close` attribute. */
  noAutoClose: boolean;
  /** The `<textarea>` that does the editing (for advanced use: measuring,
   * or a library that needs a real text control). */
  readonly textarea: HTMLTextAreaElement | null;
  selectionStart: number;
  selectionEnd: number;
  selectionDirection: string;
  /** Select a range of the text, like a textarea's. */
  setSelectionRange(start: number, end: number, direction?: "forward" | "backward" | "none"): void;
  /** Replace a range of the text, like a textarea's `setRangeText()`. A
   * script change: no events, and not on the undo stack. */
  setRangeText(replacement: string, start?: number, end?: number, selectMode?: "select" | "start" | "end" | "preserve"): void;
  /** Select all the text, like a textarea's `select()`. */
  select(): void;
  /** Focus the text field. */
  focus(options?: FocusOptions): void;
  /** Remove focus from the text field. */
  blur(): void;
  /** The current token ranges, by type, in text order (for tests and tooling). */
  tokens(): { type: string, text: string }[];
  readonly form: HTMLFormElement | null;
  readonly labels: NodeList;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "code-editor": CodeEditor;
  }
}
