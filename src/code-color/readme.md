# Code Color

Syntax-highlights its contents using
[w3-code-color](./w3-code-color.mjs) (a vendored variant of W3Schools'
color-coder), re-running highlighting whenever its child content changes
(via `MutationObserver`).

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/code-color/global.mjs"
></script>
<code-color>
  <pre>const x = 1;</pre>
</code-color>
```
