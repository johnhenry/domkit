# hot-key

Give something a keyboard shortcut: a command palette on <kbd>⌘K</kbd>,
help on <kbd>?</kbd>, a menu on <kbd>/</kbd>, the next theme on
<kbd>⌘J</kbd>. Wrap a native `<dialog>` or popover in it and the shortcut
opens and closes it, or point it at any element with `commandfor` and
`command`, exactly like a `<button>`. A dialog stays fully native:
`showModal()`, `::backdrop`, focus trapping and focus return,
`returnValue`, and the `close`/`cancel` events all work as usual.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/hot-key/global.mjs"></script>

<hot-key hotkey="mod+k">
  <dialog closedby="any">
    <form method="dialog">
      <p>Press ⌘K / Ctrl+K again, click outside, or press Esc to close.</p>
      <button>Close</button>
    </form>
  </dialog>
</hot-key>
```

## Popovers

A `[popover]` child works the same way. Esc and clicking outside close it
natively (for `popover="auto"`, the default):

```html
<hot-key hotkey="/">
  <nav popover>…</nav>
</hot-key>
```

## Commands

With `commandfor` and `command`, the shortcut does what a button with
those attributes would do when clicked, on any element in the page. The
built-in commands (`show-modal`, `close`, `request-close`,
`show-popover`, `hide-popover`, `toggle-popover`) run directly; a custom
`--command` is sent as a `command` event, so other domkit elements
respond to it:

```html
<dialog id="help">…</dialog>
<hot-key hotkey="?" commandfor="help" command="show-modal"></hot-key>

<attribute-cycler id="theme" values="light,dark">…</attribute-cycler>
<hot-key hotkey="mod+j" commandfor="theme" command="--next"></hot-key>
```

If `commandfor` names no element, or the command isn't one of these,
the key press is left alone.

## Shortcut syntax

Modifiers joined by `+`, then a key (the
[`KeyboardEvent.key`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key)
value, case-insensitive). The modifiers are `ctrl` (or `control`), `alt`
(or `option`), `shift`, `meta` (or `cmd`), and **`mod`**, which is
<kbd>⌘</kbd> on Apple platforms and <kbd>Ctrl</kbd> elsewhere. Modifiers
must match exactly, so `mod+k` doesn't fire on <kbd>⌘⇧K</kbd>. Shift is
ignored for symbol keys, so `?` works without writing `shift+?`. A
shortcut with no modifier (`/`, `?`) doesn't fire while the user is typing
in a field.

**On the `<dialog>`**, use the native
[`closedby`](https://developer.mozilla.org/docs/Web/HTML/Element/dialog#closedby)
attribute: `closedby="any"` closes on a click outside (light dismiss),
and `closedby="none"` blocks <kbd>Esc</kbd>. `<hot-key>` polyfills
both in browsers that don't support `closedby` yet.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `hotkey` | `hotkey` | `string` | One or more space-separated shortcuts, e.g. `mod+k /`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. |
| `commandfor` |  | `string` | The id of an element to send `command` to, as on a `<button>`. Without it, the shortcut toggles the `<dialog>` or popover inside. |
| `command` | `command` | `string` | With `commandfor`: the command to run, a built-in one (`show-modal`, `close`, `request-close`, `show-popover`, `hide-popover`, `toggle-popover`) or a custom `--name` (dispatched as a `command` event). |
| `non-modal` | `nonModal` | `boolean` | Open a dialog with `show()` instead of `showModal()`. |
| `disabled` | `disabled` | `boolean` | The shortcut does nothing. The dialog or popover itself is unaffected. |

### Properties

| Property | Type | Description |
|---|---|---|
| `target` (read-only) | `HTMLElement \| null` | The `<dialog>` or popover this element opens and closes: its first `<dialog>` or `[popover]` descendant. |
| `dialog` (read-only) | `HTMLDialogElement \| null` | The `<dialog>` this element controls, if its target is one. |
| `command` | `string` | Mirrors the `command` attribute. |
| `commandForElement` | `Element \| null` | The element `commandfor` names, like a button's `commandForElement`. |
| `hotkey` | `string` | Mirrors the `hotkey` attribute. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `nonModal` | `boolean` | Mirrors the `non-modal` attribute. |
| `open` (read-only) | `boolean` | Whether the dialog or popover is open. |

### Methods

| Method | Description |
|---|---|
| `show()` | Open the dialog (modally, unless `non-modal`) or popover. |
| `close(returnValue)` | Close the dialog or popover. |
| `toggle()` | Open the dialog or popover if it's closed, close it if it's open. |
| `runCommand()` | Run `command` on the `commandfor` element, as a button would. Returns false if there's no such element or command. |

<!-- api:end -->

## Notes

- The shortcut listener is on `document`, so it works wherever focus is,
  and it's removed when the element disconnects.
- To tell assistive technology about the shortcut, put
  `aria-keyshortcuts` (e.g. `aria-keyshortcuts="Meta+K"`) on whatever
  visible control also opens the dialog.
- Buttons can open the dialog without any script, using invoker commands:
  `<button commandfor="my-dialog" command="show-modal">`.
- It has no events of its own: listen to the `<dialog>`'s native `close`, `cancel`, and `toggle` events (or the popover's `toggle`).
- `closedby` is only polyfilled for a `<dialog>` it wraps; popovers have light dismiss natively.
