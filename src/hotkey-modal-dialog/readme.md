# hotkey-modal-dialog

A native `<dialog>` that a keyboard shortcut toggles open and closed (as a
modal, via `showModal()`), with optional click-outside-to-close and an
option to block <kbd>Esc</kbd>.

> **Browser support:** this is a *customized built-in* element
> (`<dialog is="hotkey-modal">`). Chromium and Firefox support those;
> **Safari does not** and has said it won't. In Safari the `<dialog>`
> still renders, but the hotkey does nothing. If you need Safari, add a
> customized-built-ins polyfill such as
> [`@ungap/custom-elements`](https://github.com/ungap/custom-elements).

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/hotkey-modal-dialog/global.mjs"
></script>

<dialog is="hotkey-modal" hotkey="ctrl+k" click-to-close>
  <p>Press Ctrl+K again, click outside, or press Esc to close.</p>
</dialog>
```

`global.mjs` registers the element as **`hotkey-modal`**, extending
`dialog`. That's the value for `is=`, not the module's directory name. To
register it under another name, import the class:

```js
import HotkeyModal from "@johnhenry/domkit/hotkey-modal-dialog";
customElements.define("command-palette", HotkeyModal, { extends: "dialog" });
```

## Attributes

| Attribute | Description |
|---|---|
| `hotkey` | **Required.** A key, optionally preceded by modifiers: `k`, `ctrl+k`, `ctrl,shift+k`. Modifiers are comma-separated before the final `+`, from `ctrl`, `shift`, `alt`, `meta`. The key is compared to [`KeyboardEvent.key`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key), so it's case-sensitive (`shift+K`, not `shift+k`) |
| `click-to-close` | Clicking the backdrop (outside the dialog's content) closes it |
| `no-esc-close` | Blocks the native <kbd>Esc</kbd>-to-close behavior. Only read on connect or when `hotkey`/`click-to-close` change |

## Notes

- The shortcut listener is on `document`, so it works wherever focus is,
  and it's removed when the dialog disconnects.
- Modifiers are only checked for *presence*, never absence. `hotkey="k"`
  also fires on <kbd>Ctrl</kbd>+<kbd>K</kbd>, and `ctrl+k` also fires on
  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>K</kbd>.
- "Click outside" means the click target is the `<dialog>` element itself,
  which is what the backdrop reports. Content needs its own wrapper (or
  padding on the content, not the dialog) for this to tell the two apart.
