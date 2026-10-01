# define-component

Register a custom element from HTML: name a tag and a module, and
`<define-component>` imports the module and calls
`customElements.define()` with its export. You can register a component
without writing a script, and its code loads only on pages that use it.
Part of [definable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"></script>

<define-component name="fancy-card" src="/components/fancy-card.mjs"></define-component>
<fancy-card>…</fancy-card>
```

Compare [define-component-by-content](../define-component-by-content/readme.md),
which builds an element from markup written in the page instead.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `name` |  | `string` | The tag name to register. |
| `src` |  | `string` | URL of the module, resolved against the document's base URL. |
| `import` |  | `string` | Name of the export to register. Default `default`. |

### Properties

| Property | Type | Description |
|---|---|---|
| `ready` (read-only) | `Promise<CustomElementConstructor>` | Resolves with the registered class once the element is defined; rejects if it couldn't be. |

### Events

| Event | Description |
|---|---|
| `load` | The element is registered (or the name already was). |
| `error` | The module failed to load, lacked the export, or the export isn't a class. An `ErrorEvent`. |

<!-- api:end -->

## Notes

- The element acts once, when it first connects. If `name` is already registered (say, by another `<define-component>`), it does nothing and reports success.
- Like `<script src>`, its `load` and `error` events don't bubble. To wait in script, `await document.querySelector("define-component").ready`.
