# class-cycler

Exposes a [localstorage-class-cycler](../localstorage-class-cycler/readme.md)
instance as a named global function, so it can be called from anywhere
(e.g. a plain `<button onclick="...">`). Container/global variant — see
[class-cycler-button](../class-cycler-button/readme.md)
for a self-contained `<button>` that does the same on click. Part of
[cyclable](../readme.md).

## Attributes

| Attribute | Description |
|---|---|
| `global` | Name to assign the cycler function to on `globalThis` (required — removing this attribute, or disconnecting the element, unassigns it) |
| `selector` | Selector for the element whose classes get cycled. Defaults to `body` |
| `storage-key` | localStorage key the current class value persists under (required. Nothing happens until both `global` and `storage-key` are set) |
| `classes` | Comma-delimited list of classes to cycle through |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/cyclable/class-cycler/global.mjs"
></script>
<class-cycler
  global="cycleTheme"
  selector="body"
  storage-key="theme"
  classes="light,dark,system"
></class-cycler>
<button onclick="cycleTheme()">Toggle theme</button>
```
