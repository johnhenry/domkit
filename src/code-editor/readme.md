# code-editor

An editable code field with syntax highlighting for JavaScript, CSS, and
HTML that works like a `<textarea>`: it has a textarea's `value` and
selection API, submits with forms, and fires `input` and `change` at the
same moments. On top of that it handles the keys you expect in a code
editor: Tab to indent, Enter to keep indentation, and auto-closed
brackets and quotes. Every one of those edits goes on the browser's own
undo stack, so Ctrl/Cmd+Z undoes it like typing.

Highlighting comes from [code-color](../code-color/readme.md): the same
tokenizer, the same `language` values, and the same
`::highlight(domkit-*)` names, so one theme colors both. It's light
enough for a page with hundreds of small editors (see
[Performance](#performance)).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/code-editor/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/code-editor/index.css" />

<form>
  <label for="code">Script</label>
  <code-editor id="code" name="code" language="js" rows="4">
<pre>function greet(name) {
  return `Hello, ${name}!`;
}</pre>
  </code-editor>
  <button>Save</button>
</form>
```

The initial text is the editor's content: a `<textarea>`, `<pre>`, or
`<code>` inside it, or plain text (with one leading newline dropped, like
a textarea). A `<pre>` (or a `<pre><code class="language-…">` from a
Markdown renderer) stays readable before the script loads, and a
`<textarea>` even stays editable; in either case, write HTML escapes
(`&lt;`) as you normally would. A `value` attribute, if present, wins.

Read and write it like a textarea:

```js
import "@johnhenry/domkit/code-editor/global.mjs";

const editor = document.querySelector("code-editor");
editor.value = "console.log(1 + 1);"; // no events, like textarea.value
editor.addEventListener("input", () => preview(editor.value));
editor.setSelectionRange(0, 7);
```

## Shortcuts are yours

The editor never claims a key with Ctrl or Cmd held, so keyboard events
reach the element (and its ancestors) as usual, uncanceled. Listen on
the element for your own shortcuts:

```js
editor.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    run(editor.value);
  }
});
```

To take over a key the editor *does* handle (say, Enter), listen in the
capture phase and call `preventDefault()`: the editor skips any keydown
that's already canceled.

```js
editor.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // the editor won't auto-indent
    submit();
  }
}, { capture: true });
```

## Height and wrapping

The editor grows with its content. `rows` sets a minimum height in lines
(or use CSS `min-height`); cap it with CSS `max-height` and it scrolls,
keeping the caret in view:

```css
code-editor { max-height: 20lh; }
```

Long lines scroll sideways by default. `wrap="soft"` (or just `wrap`)
wraps them instead.

## Why a textarea

The editing surface is a real `<textarea>`: yours, if you put one inside,
or one the element makes. Its own text is transparent; an `aria-hidden`
`<pre>` laid exactly over it paints the same text, with the highlight
ranges. A `contenteditable="plaintext-only"` `<pre>` would need no mirror,
but a textarea is what gets every one of these right in all three
engines:

- **Caret, selection, IME composition, and mobile keyboards** are the
  browser's own text-field behavior, with no DOM structure for an engine to
  rewrite. (Editable `<pre>`s differ by engine in what Enter, paste, and
  deleting a line insert: `<br>`, `<div>`, or text.)
- **Undo and redo**: `document.execCommand("insertText")` on a textarea
  records an edit on the native undo stack in Chromium, Firefox, and
  WebKit, so the editor's own edits undo like typing.
- **The value and selection are plain offsets in a plain string**, so
  `selectionStart`, `setSelectionRange()`, and `setRangeText()` are the
  textarea's own, and the form value is exactly what you see.
- **Accessibility**: a textarea is already a multiline textbox to every
  screen reader, labelled by the element's `<label>`.

The cost is keeping the mirror's text, font, and wrapping identical to
the textarea's, which the element does with inline layout styles (so it
works with no stylesheet).

## Performance

Nothing is shared or global except code-color's highlight registry:
each editor listens only to its own textarea, and stops everything when
removed. After each edit, the mirror's text is patched in place (only
the changed span), so the token ranges before and after the edit move
with their text; the text is re-tokenized once per batch of changes, and
only the ranges that changed are added to or removed from the shared
highlights.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `value` | `value` | `string` | Default value (what `form.reset()` restores). Without it, the element's initial text content is the default: a `<textarea>`'s, a `<pre>`'s, or its own. |
| `language` | `language` | `string` | `js`, `css`, or `html` (plus aliases like `javascript`, `ts`, `json`, `xml`), as for code-color. Default: a `language-*` class on a `<code>` in the initial markup, else `html`. |
| `placeholder` | `placeholder` | `string` | Text shown while the value is empty. |
| `disabled` | `disabled` | `boolean` | Blocks interaction and form submission. Also inherited from a disabled fieldset. |
| `readonly` |  | `boolean` | The value can be selected and copied but not edited. Tab then moves focus as usual. |
| `required` | `required` | `boolean` | The form is invalid while the value is empty. |
| `tab-size` | `tabSize` | `number` | Spaces per indent level, for Tab/Shift+Tab, auto-indent, and how tab characters display. Default 2. |
| `rows` | `rows` | `number` | Minimum height in lines (sets `--domkit-code-editor-rows`). The editor grows with its content; cap it with CSS `max-height`. |
| `wrap` | `wrap` | `string` | `soft` (or empty) wraps long lines; `off` (the default) scrolls them horizontally. |
| `name` | `name` | `string` | Name submitted with the form. |
| `no-auto-close` | `noAutoClose` | `boolean` | Don't auto-close brackets and quotes (also turns off typing over a closer and deleting an empty pair). |

### Properties

| Property | Type | Description |
|---|---|---|
| `value` | `string` | The current text. Setting it replaces the text (and, as for a textarea, clears the browser's undo history). Script changes don't fire events. |
| `defaultValue` | `string` | The value `form.reset()` restores: the `value` attribute if present, else the initial text content. Setting it sets the `value` attribute. |
| `textLength` (read-only) | `number` | Length of the value, like a textarea's. |
| `type` (read-only) | `string` | "textarea", like a textarea's (for code that branches on `type`). |
| `resolvedLanguage` (read-only) | `string \| null` | The language in effect: `js`, `css`, `html`, or null if unrecognized. |
| `language` | `string` | Mirrors the `language` attribute. |
| `name` | `string` | Mirrors the `name` attribute. |
| `placeholder` | `string` | Mirrors the `placeholder` attribute. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `readOnly` | `boolean` | Mirrors the `readonly` attribute. |
| `required` | `boolean` | Mirrors the `required` attribute. |
| `tabSize` | `number` | Spaces per indent level (default 2). |
| `rows` | `number` | Minimum height in lines, or 0 for none. |
| `wrap` | `string` | "soft" or "off" (the default). |
| `noAutoClose` | `boolean` | Mirrors the `no-auto-close` attribute. |
| `textarea` (read-only) | `HTMLTextAreaElement \| null` | The `<textarea>` that does the editing (for advanced use: measuring, or a library that needs a real text control). |
| `selectionStart` | `number` |  |
| `selectionEnd` | `number` |  |
| `selectionDirection` | `string` |  |
| `form` (read-only) | `HTMLFormElement \| null` |  |
| `labels` (read-only) | `NodeList` |  |
| `validity` (read-only) | `ValidityState` |  |
| `validationMessage` (read-only) | `string` |  |
| `willValidate` (read-only) | `boolean` |  |

### Methods

| Method | Description |
|---|---|
| `setSelectionRange(start, end, direction)` | Select a range of the text, like a textarea's. |
| `setRangeText(replacement, start, end, selectMode)` | Replace a range of the text, like a textarea's `setRangeText()`. A script change: no events, and not on the undo stack. |
| `select()` | Select all the text, like a textarea's `select()`. |
| `focus(options)` | Focus the text field. |
| `blur()` | Remove focus from the text field. |
| `tokens()` | The current token ranges, by type, in text order (for tests and tooling). |
| `checkValidity()` |  |
| `reportValidity()` |  |
| `setCustomValidity(message)` |  |

### Events

| Event | Description |
|---|---|
| `change` | The user committed a change: the field lost focus with a different value than when it got it, like a textarea. |
| `input` | The user changed the value (typing, pasting, undo, or an editing key). Fired from the element, with the textarea's `inputType` and `data`. |

### CSS custom properties

| Property | Description |
|---|---|
| `--domkit-code-editor-rows` | Minimum height in lines, from the `rows` attribute. |
| `--domkit-focus-ring` | Focus outline (shared token; see theme.css). |
| `--domkit-border` | Border (shared token). |

<!-- api:end -->

## Keyboard

| Key | Does |
|---|---|
| Tab | Insert spaces to the next tab stop; with a selection, indent every selected line |
| Shift+Tab | Outdent the current line, or every selected line |
| Escape, then Tab (or Shift+Tab) | Move focus out of the editor, like CodeMirror. Any other key in between cancels it |
| Enter | New line with the current indentation; one level more after `{`, `[`, or `(`; between a pair (`{|}`), split it onto three lines |
| `(` `[` `{` `'` `"` `` ` `` | Insert the pair (or wrap the selection in it). Quotes don't pair next to a word character, nor brackets in front of one. `no-auto-close` turns this off |
| `)` `]` `}` `'` `"` `` ` `` | Next to the same character, move over it instead. A closing bracket typed as a line's first character outdents the line |
| Backspace | Between an empty pair, delete both; in leading spaces, delete back to the previous tab stop |

Tab is captured for indenting, so a keyboard user leaves the editor with
Escape then Tab (WCAG 2.1.2). Mention it near the editor if your users
may not know the convention. With `readonly` (or `disabled`), Tab moves
focus as usual. Ctrl/Cmd shortcuts are never handled.

## Styling

`index.css` (optional) gives the editor a monospace font, a border,
padding, scrolling, and a focus ring on the whole element, from the
shared tokens in [`theme.css`](../theme.css). It imports code-color's
token colors; restyle them with `::highlight(domkit-keyword)` and
friends, as for [code-color](../code-color/readme.md#theming).

Style the element itself (font, padding, border, background, height).
The textarea and mirror inside inherit its font and line height, and must
keep identical box styles, so don't give either its own padding, border,
or font.

## Notes

- **Browser support:** Chromium, Firefox, and Safari. Highlighting needs
  the CSS Custom Highlight API (Chromium, Safari 17.2+, Firefox 140+);
  without it, code is shown uncolored and editing is unaffected.
- **Undo grouping follows the engine.** In Chromium, each of the
  editor's edits is its own undo step. WebKit merges consecutive edits
  made with the keyboard into one undo step, as it does for its own
  typing, so there Cmd+Z after Tab, Shift+Tab undoes both.
- Setting `value` from script clears the browser's undo history, as it
  does for a textarea.
- The editing keys work on keyboards that report keys in `keydown`.
  Virtual keyboards that report `"Unidentified"` (some Android IMEs) and
  IME composition get the plain textarea behavior: no auto-closing or
  auto-indent, everything else intact.
- `input` and `change` are fired from the element (the textarea's own
  are stopped), so `event.target` is the `<code-editor>`. Other events,
  like `keydown`, `select`, `focusin`, and `focusout`, come from the
  textarea and bubble through the element; `editor.textarea` is that
  textarea.
- Find-in-page may count a match twice: once in the textarea, once in the
  mirror that paints it.
- The tokenizer is code-color's: small, never throws, not a parser.
  TypeScript and JSON are colored as JavaScript.
