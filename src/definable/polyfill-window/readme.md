# polyfill-window

Load a module from HTML and assign its export to a global, e.g. a
polyfill or a library that expects to live on `window`. It's the
`globalThis` counterpart to [define-component](../define-component/readme.md),
which registers a custom element instead. Part of [definable](../readme.md).

## Attributes

| Attribute | Description |
|---|---|
| `name` | Global key to assign the import to (required) |
| `src` | URL of the module to import (required). A relative URL resolves against the page's URL |
| `import` | Named export to assign. Defaults to the module's default export |
| `force` | If present, re-imports and re-assigns even if `globalThis[name]` is already set |
| `no-import` | If present, the module is imported (for its side effects) but nothing is assigned to `globalThis` |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/definable/polyfill-window/global.mjs"
></script>

<!-- window.shout = (await import("./shout.mjs")).default -->
<polyfill-window name="shout" src="./shout.mjs"></polyfill-window>

<!-- import only for side effects; assign nothing -->
<polyfill-window name="BroadcastChannel" src="./broadcast-channel-polyfill.mjs" no-import></polyfill-window>
```

Relative `src` URLs resolve against the page's URL. The import is
asynchronous, so code that uses the global has to wait for it to appear.
