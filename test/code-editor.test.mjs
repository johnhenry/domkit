// <code-editor>'s editing keys, as the pure functions it applies
// (src/code-editor/edits.mjs). The element itself is form-associated, which
// happy-dom can't construct (no ElementInternals); its full contract --
// typing, undo, forms, events -- is in test/browser/code-editor.spec.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import "./dom.mjs";
import { applyEdit, backspace, indent, newline, typeCharacter } from "../src/code-editor/edits.mjs";

// "|" marks the caret; "«" and "»" mark a selection (forward).
const parse = (marked) => {
  const value = marked.replace(/[|«»]/g, "");
  const caret = marked.indexOf("|");
  if (caret >= 0) return { value, selectionStart: caret, selectionEnd: caret };
  const start = marked.indexOf("«");
  return { value, selectionStart: start, selectionEnd: marked.indexOf("»") - 1 };
};
const show = ({ value, selectionStart, selectionEnd }) =>
  selectionStart === selectionEnd
    ? value.slice(0, selectionStart) + "|" + value.slice(selectionStart)
    : value.slice(0, selectionStart) + "«" + value.slice(selectionStart, selectionEnd) + "»" + value.slice(selectionEnd);
const run = (fn, marked, ...args) => {
  const state = parse(marked);
  const change = fn(state, ...args);
  return change ? show(applyEdit(state, change)) : null;
};

test("Tab inserts spaces to the next tab stop", () => {
  assert.equal(run(indent, "|x"), "  |x");
  assert.equal(run(indent, "a|x"), "a |x");
  assert.equal(run(indent, "abc|", { tabSize: 4 }), "abc |");
});

test("Tab and Shift+Tab with a selection (re)indent every touched line", () => {
  assert.equal(run(indent, "o«ne\ntw»o"), "  o«ne\n  tw»o");
  assert.equal(run(indent, "  o«ne\n  tw»o", { outdent: true }), "o«ne\ntw»o");
  assert.equal(run(indent, "«a\nb\n»c"), "«  a\n  b\n»c", "a selection ending at a line start skips that line");
  assert.equal(run(indent, "«a\n\nb»"), "«  a\n\n  b»", "blank lines in a multi-line selection stay blank");
  assert.equal(run(indent, "x«y»z"), "  x«y»z", "a selection within one line indents the line");
  assert.equal(run(indent, "\tab|", { outdent: true }), "ab|", "a leading tab is one level");
});

test("Shift+Tab outdents the caret's line, at most one level, never past its start", () => {
  assert.equal(run(indent, "    a|", { outdent: true }), "  a|");
  assert.equal(run(indent, " |  a", { outdent: true }), "| a");
  assert.equal(run(indent, "a|", { outdent: true }), null, "nothing to outdent");
  assert.equal(run(indent, "    x|", { outdent: true, tabSize: 4 }), "x|");
});

test("Enter keeps indentation, adds a level after an opener, and splits a pair", () => {
  assert.equal(run(newline, "  a|"), "  a\n  |");
  assert.equal(run(newline, "if (x) {|"), "if (x) {\n  |");
  assert.equal(run(newline, "  f({|})"), "  f({\n    |\n  })");
  assert.equal(run(newline, "[|]", { tabSize: 4 }), "[\n    |\n]");
  assert.equal(run(newline, "x = [  |"), "x = [  \n  |", "trailing spaces after the opener");
  assert.equal(run(newline, "  a«bc»d"), "  a\n  |d", "replaces a selection");
});

test("brackets and quotes auto-close, wrap a selection, and type over their closer", () => {
  assert.equal(run(typeCharacter, "f|", "("), "f(|)");
  assert.equal(run(typeCharacter, "(|)", "["), "([|])");
  assert.equal(run(typeCharacter, "|", "`"), "`|`");
  assert.equal(run(typeCharacter, "a «b»", '"'), 'a "«b»"');
  assert.equal(run(typeCharacter, "(a|)", ")"), "(a)|");
  assert.equal(run(typeCharacter, '"a|"', '"'), '"a"|');
});

test("no auto-close next to a word, or with autoClose off", () => {
  assert.equal(run(typeCharacter, "don|", "'"), null);
  assert.equal(run(typeCharacter, "|x", '"'), null);
  assert.equal(run(typeCharacter, "|x", "("), null);
  assert.equal(run(typeCharacter, "f|", "(", { autoClose: false }), null);
  assert.equal(run(typeCharacter, "(a|)", ")", { autoClose: false }), null);
  assert.equal(run(typeCharacter, "a|", "x"), null, "ordinary characters are the browser's");
});

test("a closer typed as a line's first character outdents the line", () => {
  assert.equal(run(typeCharacter, "{\n    |", "}"), "{\n  }|");
  assert.equal(run(typeCharacter, "{\n |", "]"), "{\n]|");
});

test("Backspace deletes an empty pair, or back to the previous tab stop", () => {
  assert.equal(run(backspace, "a(|)"), "a|");
  assert.equal(run(backspace, "'|'"), "|");
  assert.equal(run(backspace, "a(|)", { autoClose: false }), null);
  assert.equal(run(backspace, "    |"), "  |");
  assert.equal(run(backspace, "   |"), null, "one space to the tab stop: the browser's own Backspace");
  assert.equal(run(backspace, "  x|"), null, "after text, the browser's own Backspace");
  assert.equal(run(backspace, "«ab»"), null, "a selection is the browser's");
});

test("the code-editor module loads, and declares itself form-associated", async () => {
  const { default: CodeEditor } = await import("../src/code-editor/index.mjs");
  assert.equal(CodeEditor.formAssociated, true);
  assert.ok(CodeEditor.observedAttributes.includes("tab-size"));
});

test("code-editor and code-color share one set of highlights", async () => {
  // happy-dom has no Highlight API; a minimal stand-in is enough to check
  // that both modules end up with the same Highlight objects.
  if (typeof Highlight !== "function") {
    Object.defineProperty(globalThis, "CSS", { value: { highlights: new Map() }, configurable: true });
    globalThis.Highlight = class extends Set {};
  }
  const { sharedHighlights } = await import(`../src/code-color/highlights.mjs?${Date.now()}`);
  const { TOKEN_TYPES } = await import("../src/code-color/index.mjs");
  const a = sharedHighlights(TOKEN_TYPES);
  const b = sharedHighlights(TOKEN_TYPES);
  assert.deepEqual(Object.keys(a), [...TOKEN_TYPES]);
  assert.ok(TOKEN_TYPES.every((type) => a[type] === b[type] && CSS.highlights.get(`domkit-${type}`) === a[type]));
});
