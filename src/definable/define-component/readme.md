# define-component

Register a custom element from HTML: name a tag and a module URL, and
`<define-component>` imports the module and calls
`customElements.define()` with its export. It's useful for registering
components without writing a script, or for deferring a component's code
until the page uses it. Part of [definable](../readme.md).

Compare [define-component-by-content](../define-component-by-content/readme.md),
which builds the element from an inline HTML string instead of a module.

## Attributes

| Attribute | Description |
|---|---|
| `name` | Tag name to register (required) |
| `src` | URL of the module to import (required). A relative URL resolves against the **page's** URL, not against this module's |
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
