# polyfill-window

Load a module from HTML and put its export on `window`, but only if that
global doesn't already exist: the polyfill pattern. It's the `globalThis`
counterpart to [define-component](../define-component/readme.md). Part of
[definable](../readme.md).

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/polyfill-window/global.mjs"></script>

<!-- window.URLPattern = (await import(…)).URLPattern, unless the browser has it -->
<polyfill-window name="URLPattern" src="https://esm.sh/urlpattern-polyfill" import="URLPattern"></polyfill-window>
```

## Attributes

| Attribute | Description |
|---|---|
| `name` | The global to assign (`window[name]`). If it already exists, nothing is imported |
| `src` | URL of the module. A relative URL resolves against the document's base URL, like `<script src>` |
| `import` | Name of the export to assign. Default: the module's default export |

To load a module just for its side effects, use a plain
`<script type="module" src="…">`.

## Events and properties

| Event | When |
|---|---|
| `load` | The global is in place (assigned now, or already there) |
| `error` | The module failed to load or has no such export. An `ErrorEvent` |

`ready` is a promise for the global's value. The import is asynchronous,
so code that needs the global should wait for `load` or `await ready`.
