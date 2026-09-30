# Hotkey Modal Dialog

A `<dialog is="hotkey-modal">` that opens/closes via a configurable
keyboard shortcut, built on the native `<dialog>` element (`showModal()`/
`close()`).

## Attributes

| Attribute | Description |
|---|---|
| `hotkey` | The shortcut, e.g. `k` or `ctrl+k` or `ctrl,shift+k` (comma-delimited modifiers before the final `+`). Toggles open/closed |
| `click-to-close` | If present, clicking the dialog's own backdrop area closes it |
| `no-esc-close` | If present, blocks the native Escape-key close behavior |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/hotkey-modal-dialog/global.mjs"
></script>
<dialog is="hotkey-modal" hotkey="ctrl+k" click-to-close>
  <p>Press Ctrl+K again, click outside, or Esc to close.</p>
</dialog>
```
