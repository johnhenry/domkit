# define-component

Register a custom element from HTML: name a tag and a module, and
`<define-component>` imports the module and calls
`customElements.define()` with its export. You can register a component
without writing a script, and its code loads only on pages that use it.
Part of [definable](../readme.md).

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"></script>

<define-component name="fancy-card" src="/components/fancy-card.mjs"></define-component>
<fancy-card>…</fancy-card>
```

Compare [define-component-by-content](../define-component-by-content/readme.md),
which builds an element from markup written in the page instead.

## Attributes

| Attribute | Description |
|---|---|
| `name` | Tag name to register |
| `src` | URL of the module. A relative URL resolves against the document's base URL (respecting `<base href>`), exactly like `<script src>` |
| `import` | Name of the export to register. Default: the module's default export |

The element acts once, when it first connects. If `name` is already
registered (say, by another `<define-component>`), it does nothing and
reports success.

## Events and properties

Like `<script src>`, it fires (non-bubbling) events:

| Event | When |
|---|---|
| `load` | The tag is registered, or already was |
| `error` | The module failed to load, has no such export, or the export isn't a class. An `ErrorEvent` whose `message` says which |

`ready` is a promise that resolves with the element's class once it's
registered, or rejects with the same error.

```js
await document.querySelector("define-component").ready;
```
