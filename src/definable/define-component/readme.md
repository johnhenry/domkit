# Define Component

Dynamically loads a module by URL and registers its export as a custom
element — the generic "define a component from a URL" pattern referenced
by [polyfill-window](../polyfill-window/readme.md)'s
own demo, and by [`matchable`](../../matchable/query-container/readme.md)'s
`query-container` and `animate-paths`, both of which
bootstrap via this exact pattern.

Compare [define-component-by-content](../define-component-by-content/readme.md),
which defines a component from an inline HTML string instead of a separate
module file.

## Attributes

| Attribute | Description |
|---|---|
| `name` | Tag name to register (required) |
| `src` | URL of the module to import, resolved relative to the current document (required) |
| `import` | Named export to use as the element class. Defaults to the module's default export |
| `force` | If present and `name` is already registered, logs a `console.warn` explaining why instead of silently doing nothing. **Cannot actually re-register the tag** — `customElements.define()` has no browser API to redefine an already-registered name, so the existing registration is always left unchanged either way; `force` only changes whether that's silent or warned about. |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"
></script>
<define-component name="my-widget" src="./my-widget.mjs"></define-component>
<my-widget></my-widget>
```
