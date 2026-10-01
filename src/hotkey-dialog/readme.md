# hotkey-dialog

Open and close a `<dialog>` with a keyboard shortcut: a command palette
on <kbd>⌘K</kbd>, help on <kbd>?</kbd>. Wrap a native `<dialog>` in it,
and the dialog stays fully native: `showModal()`, `::backdrop`, focus
trapping and focus return, `returnValue`, and the `close`/`cancel`
events all work as usual.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/hotkey-dialog/global.mjs"></script>

<hotkey-dialog hotkey="mod+k">
  <dialog closedby="any">
    <form method="dialog">
      <p>Press ⌘K / Ctrl+K again, click outside, or press Esc to close.</p>
      <button>Close</button>
    </form>
  </dialog>
</hotkey-dialog>
```

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `hotkey` | `hotkey` | One or more shortcuts, separated by spaces: `mod+k`, `ctrl+shift+p`, `?`, `mod+k /` |
| `non-modal` | `nonModal` | Open with `show()` instead of `showModal()` |
| `disabled` | `disabled` | The shortcut does nothing (the dialog is unaffected) |

**Shortcut syntax:** modifiers joined by `+`, then a key (the
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
and `closedby="none"` blocks <kbd>Esc</kbd>. `<hotkey-dialog>` polyfills
both in browsers that don't support `closedby` yet.

## Methods

| Method | Description |
|---|---|
| `show()` | Open the dialog (modally unless `non-modal`) |
| `close(returnValue?)` | Close it |
| `toggle()` | Open if closed, close if open |

`dialog` (read-only) is the controlled `<dialog>`, the first one inside
the element.

## Events

None of its own: listen to the `<dialog>`'s native `close`, `cancel`,
and `toggle` events.

## Notes

- The shortcut listener is on `document`, so it works wherever focus is,
  and it's removed when the element disconnects.
- To tell assistive technology about the shortcut, put
  `aria-keyshortcuts` (e.g. `aria-keyshortcuts="Meta+K"`) on whatever
  visible control also opens the dialog.
- Buttons can open the dialog without any script, using invoker commands:
  `<button commandfor="my-dialog" command="show-modal">`.
