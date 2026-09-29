# Class Cycler

Exposes a [localstorage-class-cycler](../localstorage-class-cycler/readme.md)
instance as a named global function, so it can be called from anywhere
(e.g. a plain `<button onclick="...">`). Container/global variant — see
[class-cycler.button.component](../class-cycler.button.component/readme.md)
for a self-contained `<button>` element that cycles its own classes.

## Attributes

| Attribute | Description |
|---|---|
| `global` | Name to assign the cycler function to on `globalThis` (required — removing this attribute, or disconnecting the element, unassigns it) |
| `selector` | Selector for the element whose classes get cycled. Defaults to `body` |
| `storage-key` | localStorage key the current class value persists under |
| `classes` | Comma-delimited list of classes to cycle through |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/class-cycler.component/global.mjs"
></script>
<class-cycler
  global="cycleTheme"
  selector="body"
  storage-key="theme"
  classes="light,dark,system"
></class-cycler>
<button onclick="cycleTheme()">Toggle theme</button>
```
