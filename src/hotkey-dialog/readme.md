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
and `closedby="none"` blocks <kbd>Esc</kbd>. `<hotkey-dialog>` polyfills
both in browsers that don't support `closedby` yet.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `hotkey` | `hotkey` | `string` | One or more space-separated shortcuts, e.g. `mod+k /`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. |
| `non-modal` | `nonModal` | `boolean` | Open with `show()` instead of `showModal()`. |
| `disabled` | `disabled` | `boolean` | The shortcut does nothing. The dialog itself is unaffected. |

### Properties

| Property | Type | Description |
|---|---|---|
| `dialog` (read-only) | `HTMLDialogElement \| null` | The `<dialog>` this element controls: its first `<dialog>` descendant. |
| `hotkey` | `string` | Mirrors the `hotkey` attribute. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `nonModal` | `boolean` | Mirrors the `non-modal` attribute. |

### Methods

| Method | Description |
|---|---|
| `show()` | Open the dialog (modally, unless `non-modal`). |
| `close(returnValue)` | Close the dialog. |
| `toggle()` | Open the dialog if it's closed, close it if it's open. |

<!-- api:end -->

## Notes

- The shortcut listener is on `document`, so it works wherever focus is,
  and it's removed when the element disconnects.
- To tell assistive technology about the shortcut, put
  `aria-keyshortcuts` (e.g. `aria-keyshortcuts="Meta+K"`) on whatever
  visible control also opens the dialog.
- Buttons can open the dialog without any script, using invoker commands:
  `<button commandfor="my-dialog" command="show-modal">`.
- It has no events of its own: listen to the `<dialog>`'s native `close`, `cancel`, and `toggle` events.
