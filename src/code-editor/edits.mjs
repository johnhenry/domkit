// The editing keys of <code-editor>, as pure functions: given the text and
// selection, each returns the edit to make (or null to let the browser do
// its default), without touching the DOM. The element applies an edit
// through the browser's editing command, so it lands on the native undo
// stack. (Internal helper: not part of the public API.)

/**
 * @typedef {{ value: string, selectionStart: number, selectionEnd: number, selectionDirection?: string }} TextState
 * @typedef {{ start: number, end: number, text: string, selectionStart: number, selectionEnd: number, selectionDirection?: string }} Edit
 *   Replace [start, end) with `text` (an empty range and text is a pure caret move), then select.
 * @typedef {{ tabSize?: number, autoClose?: boolean }} EditOptions
 */

/** Openers and closers that pair up. */
export const PAIRS = { "(": ")", "[": "]", "{": "}", "'": "'", '"': '"', "`": "`" };
const QUOTES = new Set(["'", '"', "`"]);
const CLOSERS = new Set([")", "]", "}"]);
const WORD = /[\p{L}\p{N}_$]/u;
// A bracket auto-closes only before these (or at the end): typing "(" in
// front of a word means wrapping it by hand.
const CLOSE_BEFORE = /[\s)\]};,:]/;

const lineStart = (value, position) => value.lastIndexOf("\n", position - 1) + 1;
const lineEnd = (value, position) => {
  const end = value.indexOf("\n", position);
  return end < 0 ? value.length : end;
};
const edit = (start, end, text, selectionStart = start + text.length, selectionEnd = selectionStart, selectionDirection = "none") => ({
  start,
  end,
  text,
  selectionStart,
  selectionEnd,
  selectionDirection,
});

/**
 * Tab / Shift+Tab. Tab with a bare caret inserts spaces to the next tab
 * stop; otherwise every line the selection touches is indented (or, with
 * `outdent`, outdented) by one level, keeping the selection on the same
 * text. A selection ending at the start of a line leaves that line alone,
 * and blank lines in a multi-line selection aren't indented.
 * @param {TextState} state
 * @param {EditOptions & { outdent?: boolean }} [options]
 * @returns {Edit | null}
 */
export function indent({ value, selectionStart: start, selectionEnd: end, selectionDirection = "none" }, { tabSize = 2, outdent = false } = {}) {
  if (!outdent && start === end) {
    const column = start - lineStart(value, start);
    return edit(start, end, " ".repeat(tabSize - (column % tabSize)));
  }
  const first = lineStart(value, start);
  const last = lineEnd(value, end > start && value[end - 1] === "\n" ? end - 1 : end);
  const lines = value.slice(first, last).split("\n");
  const multiple = lines.length > 1;
  const deltas = lines.map((line) => {
    if (!outdent) return multiple && line.trim() === "" ? 0 : tabSize;
    if (line.startsWith("\t")) return -1;
    return -Math.min(tabSize, /^ */.exec(line)[0].length);
  });
  if (deltas.every((delta) => delta === 0)) return null;
  const text = lines.map((line, i) => (deltas[i] >= 0 ? " ".repeat(deltas[i]) + line : line.slice(-deltas[i]))).join("\n");
  // Move a selection end with its own line's indentation, never before
  // that line's start. A selection starting at a line start stays there,
  // so it still covers whole lines.
  const shift = (position, keepLineStart) => {
    let from = first;
    let total = 0;
    for (const [i, line] of lines.entries()) {
      const to = from + line.length;
      if (position <= to || i === lines.length - 1) {
        if (keepLineStart && position === from) return from + total;
        return Math.max(from + total, position + total + deltas[i]);
      }
      total += deltas[i];
      from = to + 1;
    }
    return position;
  };
  const selectionStart = shift(start, start !== end);
  const selectionEnd = start === end ? selectionStart : shift(end, false);
  return edit(first, last, text, selectionStart, selectionEnd, selectionDirection);
}

/**
 * Enter: a new line with the current line's indentation, one level more
 * after an opening bracket; between a bracket pair (`{|}`), the pair is
 * split onto three lines with the caret on the indented middle one.
 * @param {TextState} state
 * @param {EditOptions} [options]
 * @returns {Edit}
 */
export function newline({ value, selectionStart: start, selectionEnd: end }, { tabSize = 2 } = {}) {
  const before = value.slice(lineStart(value, start), start);
  const indentation = /^[ \t]*/.exec(before)[0];
  const opener = before.trimEnd().at(-1);
  if (opener && "([{".includes(opener)) {
    const inner = indentation + " ".repeat(tabSize);
    if (value[start - 1] === opener && value[end] === PAIRS[opener]) {
      return edit(start, end, `\n${inner}\n${indentation}`, start + 1 + inner.length);
    }
    return edit(start, end, `\n${inner}`);
  }
  return edit(start, end, `\n${indentation}`);
}

/**
 * Backspace: delete an empty bracket or quote pair around the caret at
 * once (with `autoClose`), or back to the previous tab stop in a line's
 * leading spaces. Null means the browser's own Backspace.
 * @param {TextState} state
 * @param {EditOptions} [options]
 * @returns {Edit | null}
 */
export function backspace({ value, selectionStart: start, selectionEnd: end }, { tabSize = 2, autoClose = true } = {}) {
  if (start !== end || start === 0) return null;
  const previous = value[start - 1];
  if (autoClose && Object.hasOwn(PAIRS, previous) && value[start] === PAIRS[previous]) return edit(start - 1, start + 1, "");
  const before = value.slice(lineStart(value, start), start);
  if (/^ +$/.test(before)) {
    const count = ((before.length - 1) % tabSize) + 1;
    if (count > 1) return edit(start - count, start, "");
  }
  return null;
}

/**
 * A typed character. With `autoClose`: an opening bracket or quote gets its
 * closer (or wraps the selection in the pair), and typing a closer that's
 * already next to the caret just moves over it. Quotes don't auto-close
 * next to a word character (`don't`), nor brackets in front of one. Always:
 * a closing bracket typed as a line's first character outdents the line
 * one level. Null means the browser's own typing.
 * @param {TextState} state
 * @param {string} key
 * @param {EditOptions} [options]
 * @returns {Edit | null}
 */
export function typeCharacter({ value, selectionStart: start, selectionEnd: end }, key, { tabSize = 2, autoClose = true } = {}) {
  const next = value[end] ?? "";
  const previous = value[start - 1] ?? "";
  if (autoClose && start === end && (CLOSERS.has(key) || QUOTES.has(key)) && next === key) {
    return edit(start, start, "", start + 1);
  }
  if (autoClose && Object.hasOwn(PAIRS, key)) {
    const closer = PAIRS[key];
    if (start !== end) return edit(start, end, key + value.slice(start, end) + closer, start + 1, end + 1);
    const allowed = QUOTES.has(key)
      ? !WORD.test(previous) && !WORD.test(next) && previous !== key
      : !next || CLOSE_BEFORE.test(next);
    if (allowed) return edit(start, end, key + closer, start + 1);
  }
  if (CLOSERS.has(key) && start === end) {
    const from = lineStart(value, start);
    const before = value.slice(from, start);
    if (/^ +$/.test(before)) return edit(from, start, " ".repeat(Math.max(0, before.length - tabSize)) + key);
  }
  return null;
}

/**
 * The text and selection after an edit (what the element expects the
 * browser to produce, and its fallback when there's no editing command).
 * @param {TextState} state
 * @param {Edit} change
 * @returns {TextState}
 */
export function applyEdit({ value }, change) {
  return {
    value: value.slice(0, change.start) + change.text + value.slice(change.end),
    selectionStart: change.selectionStart,
    selectionEnd: change.selectionEnd,
    selectionDirection: change.selectionDirection ?? "none",
  };
}
