# Polyfill Window

Dynamically imports a module and assigns its export to a key on
`globalThis` -- for loading a global polyfill declaratively from HTML,
rather than registering a custom element (compare
[define-component.component](../define-component.component/readme.md),
which this module's own `demo.html` uses to bootstrap itself and which
solves the related "register a custom element from a URL" problem).

## Attributes

| Attribute | Description |
|---|---|
| `name` | Global key to assign the import to (required) |
| `src` | URL of the module to import, resolved relative to the current document (required) |
| `import` | Named export to assign. Defaults to the module's default export |
| `force` | If present, re-imports and re-assigns even if `globalThis[name]` is already set |
| `no-import` | If present, the module is imported (for its side effects) but nothing is assigned to `globalThis` |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/define-component.component/global.mjs"
></script>
<define-component name="polyfill-window" src="./index.mjs"></define-component>

<polyfill-window name="shout" src="./shout-polyfill.mjs"></polyfill-window>
```
