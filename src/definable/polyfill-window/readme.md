# polyfill-window

Load a module from HTML and put its export on `window`, but only if that
global doesn't already exist: the polyfill pattern. It's the `globalThis`
counterpart to [define-component](../define-component/readme.md). Part of
[definable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/polyfill-window/global.mjs"></script>

<!-- window.URLPattern = (await import(…)).URLPattern, unless the browser has it -->
<polyfill-window name="URLPattern" src="https://esm.sh/urlpattern-polyfill" import="URLPattern"></polyfill-window>
```

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `name` |  | `string` | The global to assign (`window[name]`). |
| `src` |  | `string` | URL of the module, resolved against the document's base URL. |
| `import` |  | `string` | Name of the export to assign. Default `default`. |

### Properties

| Property | Type | Description |
|---|---|---|
| `ready` (read-only) | `Promise<unknown>` | Resolves with the global's value once it's in place. |

### Events

| Event | Description |
|---|---|
| `error` | The module failed to load or lacked the export. An `ErrorEvent`. |
| `load` | The global is in place (assigned now, or already there). |

<!-- api:end -->

## Notes

- To load a module just for its side effects, use a plain `<script type="module" src="…">`.
- The import is asynchronous, so code that needs the global should wait for `load` or `await ready`.
