// <code-editor>: an editable, syntax-highlighted code field that behaves
// like a <textarea>: same value/selection API, form participation, and
// input/change timing, plus code-editing keys (indent, auto-indent,
// bracket pairs).
//
// The editing surface IS a real <textarea> (yours, if you wrote one inside,
// or a generated one). Its own glyphs are transparent; an aria-hidden
// <pre> mirror laid exactly over it paints the same text, colored by
// <code-color>'s tokenizer and shared ::highlight(domkit-*) highlights.
// So caret, selection, IME, mobile keyboards, spellcheck/autocorrect
// controls, and the browser's own undo stack are all native. Every edit the
// element makes goes through document.execCommand("insertText"), which
// records it on that undo stack: one Ctrl/Cmd+Z undoes one edit.
// See readme.md for why this beats a contenteditable surface.

import { languageOf, tokenize } from "../code-color/tokenize.mjs";
import { TOKEN_TYPES } from "../code-color/index.mjs";
import { sharedHighlights } from "../code-color/highlights.mjs";
import { valueMissingText, tooLongText, tooShortText } from "../native-validation.mjs";

// Attributes a <textarea> understands that the editor hands straight to its
// textarea, so they behave natively.
const PASSED_THROUGH = ["maxlength", "minlength", "inputmode", "enterkeyhint"];
// Text-entry helpers that are right for prose and wrong for code: off by
// default, and passed through when the author sets them.
const CODE_DEFAULTS = [
  ["spellcheck", "false"],
  ["autocapitalize", "off"],
  ["autocorrect", "off"],
  ["autocomplete", "off"],
];

/** A non-negative integer attribute, or -1 (absent or invalid), like a textarea's maxLength. */
function lengthAttribute(element, name) {
  const value = Number.parseInt(element.getAttribute(name) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : -1;
}
import { applyEdit, backspace, indent, newline, typeCharacter } from "./edits.mjs";

// code-color's highlights (the same Highlight objects), so one theme
// colors both elements.
const highlights = sharedHighlights(TOKEN_TYPES);
let uid = 0;
const setAttr = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock"]);

/**
 * An editable code field with syntax highlighting (JavaScript, CSS, HTML),
 * built on a real `<textarea>`: form-associated, with a textarea's value,
 * selection API, and events, plus indent/outdent, auto-indent, and
 * auto-closed brackets and quotes that all keep native undo working.
 *
 * @tag code-editor
 * @summary A syntax-highlighted code field that works like a textarea.
 *
 * @attr {string} name - Name submitted with the form.
 * @attr {string} value - Default value (what `form.reset()` restores). Without it, the element's initial text content is the default: a `<textarea>`'s, a `<pre>`'s, or its own.
 * @attr {string} language - `js`, `css`, or `html` (plus aliases like `javascript`, `ts`, `json`, `xml`), as for code-color. Default: a `language-*` class on a `<code>` in the initial markup, else `html`.
 * @attr {string} placeholder - Text shown while the value is empty.
 * @attr {number} tab-size - Spaces per indent level, for Tab/Shift+Tab, auto-indent, and how tab characters display. Default 2.
 * @attr {number} rows - Minimum height in lines, default 2 like a textarea (sets `--domkit-code-editor-rows`). The editor grows with its content; cap it with CSS `max-height`.
 * @attr {string} wrap - Long lines wrap by default, like a textarea (`soft`, `hard`, empty or absent); `off` scrolls them horizontally.
 * @attr {number} maxlength - Maximum length; typing stops there, and a longer value the user typed is `tooLong`, like a textarea.
 * @attr {number} minlength - Minimum length; a shorter, non-empty value the user typed is `tooShort`, like a textarea.
 * @attr {string} spellcheck - Off by default (code isn't prose); `spellcheck="true"` turns the browser's checking back on.
 * @attr {string} autocapitalize - Off by default for code; any value is passed to the textarea.
 * @attr {string} autocorrect - Off by default for code; any value is passed to the textarea.
 * @attr {string} autocomplete - Off by default for code; any value is passed to the textarea.
 * @attr {string} inputmode - Passed to the textarea (virtual keyboard hint).
 * @attr {string} enterkeyhint - Passed to the textarea (virtual keyboard Enter label).
 * @attr {boolean} autofocus - Focus the editor when it is first connected, if nothing else has focus.
 * @attr {boolean} no-auto-close - Don't auto-close brackets and quotes (also turns off typing over a closer and deleting an empty pair).
 * @attr {boolean} readonly - The value can be selected and copied but not edited. Tab then moves focus as usual.
 * @attr {boolean} disabled - Blocks interaction and form submission. Also inherited from a disabled fieldset.
 * @attr {boolean} required - The form is invalid while the value is empty.
 *
 * @fires input - The user changed the value (typing, pasting, undo, or an editing key). Fired from the element, with the textarea's `inputType` and `data`.
 * @fires change - The user committed a change: the field lost focus with a different value than when it got it, like a textarea.
 *
 * @cssprop --domkit-code-editor-rows - Minimum height in lines, from the `rows` attribute.
 * @cssprop --domkit-focus-ring - Focus outline (shared token; see theme.css).
 * @cssprop --domkit-border - Border (shared token).
 */
export default class CodeEditor extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = [
    "value", "language", "placeholder", "disabled", "readonly", "required", "tab-size", "rows", "wrap",
    ...PASSED_THROUGH, ...CODE_DEFAULTS.map(([name]) => name),
  ];

  #internals = this.attachInternals();
  #input = null; // the <textarea>
  #mirror = null; // the highlighted <pre>
  #text = null; // its one Text node: value + "\n"
  #ranges = []; // [type, live Range] in #text, registered in the shared highlights
  #pending = false;
  #contentDefault = ""; // initial text content, the default without a value attribute
  #markupLanguage = null; // from a language-* class in the initial markup
  #initialValue = null; // value set from script before the element was built
  #dirty = false; // like a textarea's dirty value flag
  #userEdited = false; // the value was last changed by the user (tooLong/tooShort apply only then)
  #autofocused = false;
  #formDisabled = false;
  #customError = "";
  #escaped = false; // Escape was just pressed: the next Tab leaves
  #observedLabels = [];
  #labelClick = () => this.focus();

  constructor() {
    super();
    // A press on the element's padding (outside the textarea) still edits,
    // like a click below the last line of a textarea.
    this.addEventListener("pointerdown", (event) => {
      const input = this.#input;
      if (!input || event.target === input || !this.#interactive || event.button !== 0) return;
      event.preventDefault();
      if (document.activeElement === input || input.getRootNode().activeElement === input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  connectedCallback() {
    this.#build();
    this.#bindLabels();
    this.#refresh();
    this.#paint();
    // Like autofocus on a native control: once, and only if nothing else
    // has taken focus by the time the document is ready for it.
    if (this.hasAttribute("autofocus") && !this.#autofocused) {
      this.#autofocused = true;
      queueMicrotask(() => {
        const active = this.ownerDocument.activeElement;
        if (this.isConnected && (!active || active === this.ownerDocument.body)) this.#input?.focus();
      });
    }
  }

  disconnectedCallback() {
    for (const label of this.#observedLabels) label.removeEventListener("click", this.#labelClick);
    this.#observedLabels = [];
    this.#unpaint();
  }

  attributeChangedCallback(name, previous, current) {
    if (name === "rows") {
      const rows = this.rows;
      if (this.hasAttribute("rows")) this.style.setProperty("--domkit-code-editor-rows", String(rows));
      else this.style.removeProperty("--domkit-code-editor-rows");
    }
    if (!this.#input) return;
    if (name === "value" && previous !== current && !this.#dirty) {
      // Like <input value>: the attribute is the default value, and changing
      // it updates the current value until the user (or script) edits it.
      this.#input.value = this.defaultValue;
      this.#sync();
    }
    if (name === "language") this.#schedule();
    this.#refresh();
  }

  // --- the HTMLTextAreaElement contract -----------------------------------

  /**
   * The current text. Setting it replaces the text (and, as for a textarea,
   * clears the browser's undo history). Script changes don't fire events.
   * @type {string}
   */
  get value() {
    return this.#input?.value ?? this.#initialValue ?? this.defaultValue;
  }
  set value(value) {
    value = String(value ?? "").replace(/\r\n?/g, "\n");
    this.#dirty = true;
    this.#userEdited = false;
    if (!this.#input) {
      this.#initialValue = value;
      return;
    }
    if (this.#input.value !== value) this.#input.value = value;
    this.#sync();
  }

  /**
   * The value `form.reset()` restores: the `value` attribute if present,
   * else the initial text content. Setting it sets the `value` attribute.
   * @type {string}
   */
  get defaultValue() {
    return this.getAttribute("value") ?? this.#contentDefault;
  }
  set defaultValue(value) {
    this.setAttribute("value", String(value ?? ""));
  }

  /**
   * Length of the value, like a textarea's.
   * @type {number}
   * @readonly
   */
  get textLength() {
    return this.value.length;
  }

  /**
   * "textarea", like a textarea's (for code that branches on `type`).
   * @type {string}
   * @readonly
   */
  get type() {
    return "textarea";
  }

  /**
   * The language in effect: `js`, `css`, `html`, or null if unrecognized.
   * @type {string | null}
   * @readonly
   */
  get resolvedLanguage() {
    return languageOf(this.getAttribute("language") ?? this.#markupLanguage ?? "html");
  }

  /** @type {string} */
  get language() {
    return this.getAttribute("language") ?? "";
  }
  set language(value) {
    this.setAttribute("language", value);
  }

  /** @type {string} */
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.setAttribute("name", value);
  }

  /** @type {string} */
  get placeholder() {
    return this.getAttribute("placeholder") ?? "";
  }
  set placeholder(value) {
    this.setAttribute("placeholder", value);
  }

  /** @type {boolean} */
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  /**
   * Mirrors the `readonly` attribute.
   * @type {boolean}
   */
  get readOnly() {
    return this.hasAttribute("readonly");
  }
  set readOnly(value) {
    this.toggleAttribute("readonly", Boolean(value));
  }

  /** @type {boolean} */
  get required() {
    return this.hasAttribute("required");
  }
  set required(value) {
    this.toggleAttribute("required", Boolean(value));
  }

  /**
   * Spaces per indent level (default 2).
   * @type {number}
   */
  get tabSize() {
    const size = Number.parseInt(this.getAttribute("tab-size") ?? "", 10);
    return Number.isFinite(size) && size > 0 ? Math.min(size, 16) : 2;
  }
  set tabSize(value) {
    this.setAttribute("tab-size", String(value));
  }

  /**
   * Minimum height in lines (default 2, like a textarea).
   * @type {number}
   */
  get rows() {
    const rows = Number.parseInt(this.getAttribute("rows") ?? "", 10);
    return Number.isFinite(rows) && rows > 0 ? rows : 2;
  }
  set rows(value) {
    this.setAttribute("rows", String(value));
  }

  /**
   * Reflects the `wrap` attribute as written ("" when absent), like a
   * textarea's. Long lines wrap unless it is `off`.
   * @type {string}
   */
  get wrap() {
    return this.getAttribute("wrap") ?? "";
  }
  set wrap(value) {
    this.setAttribute("wrap", value);
  }

  /**
   * Mirrors the `maxlength` attribute; -1 when absent, like a textarea's.
   * @type {number}
   */
  get maxLength() {
    return lengthAttribute(this, "maxlength");
  }
  set maxLength(value) {
    this.setAttribute("maxlength", String(value));
  }

  /**
   * Mirrors the `minlength` attribute; -1 when absent, like a textarea's.
   * @type {number}
   */
  get minLength() {
    return lengthAttribute(this, "minlength");
  }
  set minLength(value) {
    this.setAttribute("minlength", String(value));
  }

  /**
   * Mirrors the `autocomplete` attribute.
   * @type {string}
   */
  get autocomplete() {
    return this.getAttribute("autocomplete") ?? "";
  }
  set autocomplete(value) {
    this.setAttribute("autocomplete", value);
  }

  /**
   * Mirrors the `no-auto-close` attribute.
   * @type {boolean}
   */
  get noAutoClose() {
    return this.hasAttribute("no-auto-close");
  }
  set noAutoClose(value) {
    this.toggleAttribute("no-auto-close", Boolean(value));
  }

  /**
   * The `<textarea>` that does the editing (for advanced use: measuring,
   * or a library that needs a real text control).
   * @type {HTMLTextAreaElement | null}
   * @readonly
   */
  get textarea() {
    return this.#input;
  }

  /** @type {number} */
  get selectionStart() {
    return this.#input?.selectionStart ?? 0;
  }
  set selectionStart(value) {
    if (this.#input) this.#input.selectionStart = value;
  }

  /** @type {number} */
  get selectionEnd() {
    return this.#input?.selectionEnd ?? 0;
  }
  set selectionEnd(value) {
    if (this.#input) this.#input.selectionEnd = value;
  }

  /** @type {string} */
  get selectionDirection() {
    return this.#input?.selectionDirection ?? "none";
  }
  set selectionDirection(value) {
    if (this.#input) this.#input.selectionDirection = /** @type {any} */ (value);
  }

  /**
   * Select a range of the text, like a textarea's.
   * @param {number} start
   * @param {number} end
   * @param {"forward" | "backward" | "none"} [direction]
   */
  setSelectionRange(start, end, direction) {
    this.#input?.setSelectionRange(start, end, direction);
  }

  /**
   * Replace a range of the text, like a textarea's `setRangeText()`. A
   * script change: no events, and not on the undo stack.
   * @param {string} replacement
   * @param {number} [start]
   * @param {number} [end]
   * @param {"select" | "start" | "end" | "preserve"} [selectMode]
   */
  setRangeText(replacement, start, end, selectMode) {
    if (!this.#input) return;
    if (start === undefined) this.#input.setRangeText(replacement);
    else this.#input.setRangeText(replacement, start, end ?? start, selectMode);
    this.#dirty = true;
    this.#userEdited = false;
    this.#sync();
  }

  /** Select all the text, like a textarea's `select()`. */
  select() {
    this.#input?.select();
  }

  /**
   * Focus the text field.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    if (this.#input) this.#input.focus(options);
    else super.focus(options);
  }

  /** Remove focus from the text field. */
  blur() {
    this.#input?.blur();
  }

  /**
   * The current token ranges, by type, in text order (for tests and tooling).
   * @returns {{ type: string, text: string }[]}
   */
  tokens() {
    return this.#ranges
      .filter(([, range]) => !range.collapsed)
      .map(([type, range]) => ({ type, text: range.toString() }));
  }

  /**
   * @type {HTMLFormElement | null}
   * @readonly
   */
  get form() {
    return this.#internals.form;
  }
  /**
   * @type {NodeList}
   * @readonly
   */
  get labels() {
    return this.#internals.labels;
  }
  /**
   * @type {ValidityState}
   * @readonly
   */
  get validity() {
    return this.#internals.validity;
  }
  /**
   * @type {string}
   * @readonly
   */
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  /**
   * @type {boolean}
   * @readonly
   */
  get willValidate() {
    return this.#internals.willValidate;
  }
  /** @returns {boolean} */
  checkValidity() {
    return this.#internals.checkValidity();
  }
  /** @returns {boolean} */
  reportValidity() {
    return this.#internals.reportValidity();
  }
  /** @param {string} message */
  setCustomValidity(message) {
    this.#customError = String(message ?? "");
    this.#refresh();
  }

  // --- form lifecycle -----------------------------------------------------

  formResetCallback() {
    this.#dirty = false;
    this.#userEdited = false;
    if (!this.#input) {
      this.#initialValue = null;
      return;
    }
    this.#input.value = this.defaultValue;
    this.#sync();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#refresh();
  }

  formStateRestoreCallback(state) {
    if (typeof state === "string") this.value = state;
  }

  // --- structure ----------------------------------------------------------

  get #interactive() {
    return !this.disabled && !this.#formDisabled;
  }

  #build() {
    if (this.#input) return;
    const authored = this.querySelector(":scope > textarea");
    const code = this.querySelector("code[class*='lang']");
    this.#markupLanguage = /(?:^|\s)lang(?:uage)?-(\S+)/.exec(code?.className ?? "")?.[1] ?? null;
    // The initial content: a <textarea>'s, else a <pre>'s or <code>'s, else
    // the element's own text (one leading newline dropped, like a textarea).
    const block = this.querySelector(":scope > pre, :scope > code");
    if (authored) this.#contentDefault = authored.defaultValue;
    else if (block) this.#contentDefault = block.textContent;
    else this.#contentDefault = this.textContent.replace(/^\r?\n/, "");
    this.#contentDefault = this.#contentDefault.replace(/\r\n?/g, "\n");
    for (const child of [...this.childNodes]) if (child !== authored) child.remove();

    const input = authored ?? document.createElement("textarea");
    this.#input = input;
    input.removeAttribute("name"); // the element submits, not the textarea
    // No form owner, so the textarea is never submitted, validated, or reset
    // on its own: the element does all three (an empty form id matches
    // nothing).
    input.setAttribute("form", "");
    input.setAttribute("aria-multiline", "true");
    input.id ||= `code-editor-input-${++uid}`;

    const mirror = document.createElement("pre");
    mirror.setAttribute("aria-hidden", "true");
    this.#mirror = mirror;
    this.#text = document.createTextNode("\n");
    mirror.append(this.#text);

    // The textarea and the mirror share one box: the mirror (in flow) sizes
    // it, so the editor grows with its content, and the textarea fills it.
    // Only layout is set here (no colors, fonts, or sizes), so it works with
    // no stylesheet; index.css adds the looks.
    const surface = document.createElement("div");
    surface.style.cssText = "position:relative;min-inline-size:100%;box-sizing:border-box";
    const shared =
      "display:block;box-sizing:border-box;margin:0;padding:0;border:0;font:inherit;letter-spacing:inherit;" +
      "word-spacing:inherit;line-height:inherit;text-transform:none;text-indent:0;text-align:start;background:transparent;";
    input.style.cssText +=
      shared +
      "position:absolute;inset:0;inline-size:100%;block-size:100%;resize:none;overflow:hidden;color:inherit;" +
      "min-inline-size:0;min-block-size:0;max-inline-size:none;max-block-size:none";
    mirror.style.cssText =
      shared +
      // (Not user-select: none: WebKit then paints this text's highlights
      // over all the text after it. pointer-events: none is enough to keep
      // selection in the textarea.)
      "position:relative;pointer-events:none;" +
      "min-block-size:calc(var(--domkit-code-editor-rows, 2) * 1lh)";
    // The mirror paints above the textarea, so the textarea's own selection
    // and caret show through beneath the colored text.
    surface.append(input, mirror);
    this.append(surface);
    this.#surface = surface;

    input.addEventListener("input", (event) => {
      event.stopPropagation(); // the element fires its own
      this.#dirty = true;
      this.#userEdited = true;
      this.#sync();
      this.#reveal();
      this.#fire(event);
    });
    // The textarea is always exactly as big as its text, so it should never
    // scroll; but browsers scroll it (overflow: hidden or not) to reveal the
    // caret before the mirror has grown to make room. Undo that, and reveal
    // the caret by scrolling the element and the page instead.
    input.addEventListener("scroll", () => {
      if (!input.scrollTop && !input.scrollLeft) return;
      input.scrollTop = 0;
      input.scrollLeft = 0;
      this.#reveal();
    });
    input.addEventListener("change", (event) => {
      event.stopPropagation();
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
    input.addEventListener("keydown", (event) => this.#onKeyDown(event));
    input.addEventListener("blur", () => (this.#escaped = false));

    if (authored) {
      // Text typed before the element upgraded is kept.
      this.#dirty = authored.value !== authored.defaultValue;
    }
    if (this.#initialValue !== null) input.value = this.#initialValue;
    else if (!authored) input.value = this.defaultValue;
    this.#initialValue = null;
    this.#sync();
  }

  #surface = null;

  #bindLabels() {
    for (const label of this.#observedLabels) label.removeEventListener("click", this.#labelClick);
    this.#observedLabels = [...(this.#internals.labels ?? [])];
    for (const label of this.#observedLabels) label.addEventListener("click", this.#labelClick);
    // Name the textarea by the element's labels (they point at the element,
    // but the textarea is what assistive technology focuses). An author's
    // own name on the textarea wins.
    const input = this.#input;
    if (input.hasAttribute("aria-label") || (input.hasAttribute("aria-labelledby") && !this.#ownLabelledby)) return;
    if (this.#observedLabels.length) {
      for (const label of this.#observedLabels) label.id ||= `code-editor-label-${++uid}`;
      setAttr(input, "aria-labelledby", this.#observedLabels.map((label) => label.id).join(" "));
      this.#ownLabelledby = true;
    } else if (this.hasAttribute("aria-labelledby")) {
      setAttr(input, "aria-labelledby", this.getAttribute("aria-labelledby"));
      this.#ownLabelledby = true;
    } else if (this.hasAttribute("aria-label")) {
      input.setAttribute("aria-label", this.getAttribute("aria-label"));
    }
  }
  #ownLabelledby = false;

  #refresh() {
    const input = this.#input;
    if (!input) return;
    const interactive = this.#interactive;
    input.disabled = !interactive;
    // The mirror is aria-hidden; this tells auditing tools its (dimmed) text
    // belongs to a disabled control.
    if (interactive) this.#mirror.removeAttribute("aria-disabled");
    else this.#mirror.setAttribute("aria-disabled", "true");
    input.readOnly = this.readOnly;
    setAttr(input, "aria-required", String(this.required));
    if (this.hasAttribute("placeholder")) setAttr(input, "placeholder", this.placeholder);
    else input.removeAttribute("placeholder");
    for (const name of PASSED_THROUGH) {
      if (this.hasAttribute(name)) setAttr(input, name, this.getAttribute(name));
      else input.removeAttribute(name);
    }
    // Code isn't prose: these are off unless the author sets them.
    for (const [name, fallback] of CODE_DEFAULTS) setAttr(input, name, this.getAttribute(name) ?? fallback);
    const wrap = this.wrap.toLowerCase() !== "off";
    setAttr(input, "wrap", wrap ? "soft" : "off");
    for (const element of [input, this.#mirror]) {
      element.style.whiteSpace = wrap ? "pre-wrap" : "pre";
      element.style.overflowWrap = wrap ? "anywhere" : "normal";
      element.style.tabSize = String(this.tabSize);
    }
    // Unwrapped, long lines widen the surface, and the element scrolls.
    this.#surface.style.inlineSize = wrap ? "auto" : "max-content";
    this.#updateForm();
  }

  #updateForm() {
    const input = this.#input;
    this.#internals.setFormValue(input.value, input.value);
    if (this.#customError) {
      this.#internals.setValidity({ customError: true }, this.#customError, input);
    } else if (this.required && !input.value) {
      this.#internals.setValidity({ valueMissing: true }, valueMissingText(), input);
    } else if (this.#userEdited && this.maxLength >= 0 && input.value.length > this.maxLength) {
      this.#internals.setValidity({ tooLong: true }, tooLongText(this.maxLength, input.value.length), input);
    } else if (this.#userEdited && this.minLength > 0 && input.value.length > 0 && input.value.length < this.minLength) {
      this.#internals.setValidity({ tooShort: true }, tooShortText(this.minLength, input.value.length), input);
    } else {
      this.#internals.setValidity({});
    }
  }

  // --- the mirror and its highlighting ------------------------------------

  // Bring the mirror's text up to date with the textarea's, changing only
  // the part that differs: the live token ranges before and after the edit
  // move with their text, so re-highlighting only touches what changed.
  #sync() {
    const input = this.#input;
    const next = `${input.value}\n`;
    const text = this.#text;
    const old = text.data;
    if (old !== next) {
      const limit = Math.min(old.length, next.length);
      let start = 0;
      while (start < limit && old.charCodeAt(start) === next.charCodeAt(start)) start++;
      let end = 0;
      while (end < limit - start && old.charCodeAt(old.length - 1 - end) === next.charCodeAt(next.length - 1 - end)) end++;
      text.replaceData(start, old.length - end - start, next.slice(start, next.length - end));
    }
    // The textarea draws its glyphs only while it shows its placeholder.
    input.style.setProperty("-webkit-text-fill-color", input.value ? "transparent" : "");
    this.#updateForm();
    this.#schedule();
  }

  // Batch bursts of edits into one tokenizing pass (still before paint).
  #schedule() {
    if (this.#pending) return;
    this.#pending = true;
    queueMicrotask(() => {
      this.#pending = false;
      if (this.isConnected) this.#paint();
    });
  }

  #paint() {
    if (!this.#text || !this.isConnected) return;
    const node = this.#text;
    const value = this.#input.value;
    const language = this.resolvedLanguage;
    const previous = new Map();
    for (const entry of this.#ranges) {
      const [type, range] = entry;
      const key = `${type}:${range.startOffset}:${range.endOffset}`;
      if (range.collapsed || previous.has(key)) highlights?.[type].delete(range);
      else previous.set(key, entry);
    }
    const ranges = [];
    if (language) {
      for (const [type, start, end] of tokenize(value, language)) {
        if (end <= start) continue;
        const key = `${type}:${start}:${end}`;
        const kept = previous.get(key);
        if (kept) {
          previous.delete(key);
          ranges.push(kept);
          continue;
        }
        const range = new Range();
        range.setStart(node, start);
        range.setEnd(node, end);
        highlights?.[type].add(range);
        ranges.push([type, range]);
      }
    }
    for (const [type, range] of previous.values()) highlights?.[type].delete(range);
    this.#ranges = ranges;
  }

  // Scroll the caret into view (in the element, if it scrolls, and the
  // page): a probe at the caret's spot in the mirror, scrolled into view.
  #reveal() {
    const input = this.#input;
    const root = input.getRootNode();
    if (root.activeElement !== input) return;
    const offset = input.selectionDirection === "backward" ? input.selectionStart : input.selectionEnd;
    const range = new Range();
    range.setStart(this.#text, offset);
    range.setEnd(this.#text, offset + 1); // the mirror always ends in "\n"
    const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
    range.detach?.();
    const box = this.#surface.getBoundingClientRect();
    if (!this.#probe) {
      this.#probe = document.createElement("span");
      this.#probe.setAttribute("aria-hidden", "true");
      this.#probe.style.cssText = "position:absolute;inline-size:1px;pointer-events:none;visibility:hidden";
    }
    const probe = this.#probe;
    probe.style.top = `${rect.top - box.top}px`;
    probe.style.left = `${rect.left - box.left}px`;
    probe.style.height = `${Math.max(rect.height, 1)}px`;
    this.#surface.append(probe);
    probe.scrollIntoView({ block: "nearest", inline: "nearest" });
    probe.remove(); // left in place, it would keep stretching the scroll area
  }
  #probe = null;

  #unpaint() {
    if (highlights) for (const [type, range] of this.#ranges) highlights[type].delete(range);
    this.#ranges = [];
  }

  // Re-fire the textarea's input event from the element.
  #fire(source) {
    const init = { bubbles: true, composed: true };
    const event =
      typeof InputEvent === "function" && source instanceof InputEvent
        ? new InputEvent("input", { ...init, inputType: source.inputType, data: source.data, isComposing: source.isComposing })
        : new Event("input", init);
    this.dispatchEvent(event);
  }

  // --- editing ------------------------------------------------------------

  // Make an edit as the user: through the browser's editing command, so it
  // lands on the native undo stack and fires input like typing does.
  #apply(change) {
    const input = this.#input;
    const before = { value: input.value, selectionStart: input.selectionStart, selectionEnd: input.selectionEnd };
    const expected = applyEdit(before, change).value;
    if (change.start !== change.end || change.text) {
      input.setSelectionRange(change.start, change.end);
      let done = false;
      try {
        done = document.execCommand(change.text ? "insertText" : "delete", false, change.text);
      } catch {
        done = false;
      }
      if (input.value !== expected) {
        // No editing command here (or it did something else): edit directly.
        // The browser's undo can't see this edit, but nothing is lost.
        if (!done || input.value === before.value) input.setRangeText(change.text, change.start, change.end);
        else input.value = expected;
        this.#dirty = true;
        this.#userEdited = true;
        this.#sync();
        this.#fire(new InputEvent("input", { inputType: change.text ? "insertText" : "deleteContentBackward", data: change.text || null }));
      }
    }
    input.setSelectionRange(change.selectionStart, change.selectionEnd, /** @type {any} */ (change.selectionDirection));
    this.#reveal();
  }

  #onKeyDown(event) {
    if (MODIFIER_KEYS.has(event.key)) return;
    const escaped = this.#escaped;
    this.#escaped = event.key === "Escape";
    // Keys the author already handled (a capture listener that called
    // preventDefault()), composition, and shortcuts are never claimed.
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    if (!this.#interactive || this.readOnly) return;
    if (event.metaKey || (event.ctrlKey && !event.altKey)) return;
    const input = this.#input;
    const state = { value: input.value, selectionStart: input.selectionStart, selectionEnd: input.selectionEnd, selectionDirection: input.selectionDirection };
    const options = { tabSize: this.tabSize, autoClose: !this.noAutoClose };
    const { key } = event;
    let change = null;
    if (key === "Tab") {
      if (escaped || event.altKey) return; // Escape, then Tab: leave the editor
      event.preventDefault(); // Tab is claimed even when there's nothing to outdent
      change = indent(state, { ...options, outdent: event.shiftKey });
    } else if (key === "Enter" && !event.shiftKey && !event.altKey) {
      change = newline(state, options);
    } else if (key === "Backspace" && !event.shiftKey && !event.altKey) {
      change = backspace(state, options);
    } else if (key.length === 1) {
      // (Alt/AltGr can type brackets on some layouts.)
      change = typeCharacter(state, key, options);
    }
    if (!change) return;
    event.preventDefault();
    this.#apply(change);
  }
}
