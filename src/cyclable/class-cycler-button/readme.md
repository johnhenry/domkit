# class-cycler-button

> **Browser support:** a customized built-in (`<button is="…">`), which
> Chromium and Firefox support and **Safari does not**. For Safari, use
> [class-cycler](../class-cycler/readme.md) with an ordinary `<button>`,
> or add a polyfill such as
> [`@ungap/custom-elements`](https://github.com/ungap/custom-elements).

A `<button is="class-cycler-button">` that cycles the classes of one or
more target elements every time it's clicked, via
[localstorage-class-cycler](../localstorage-class-cycler/readme.md).
Self-contained button variant — see
[class-cycler](../class-cycler/readme.md)
for a global-function variant callable from anywhere. Part of
[cyclable](../readme.md).

## Attributes

| Attribute | Description |
|---|---|
| `select` | Selector for a single target element. Defaults to `html` if neither `select` nor `select-all` is set |
| `select-all` | Selector for multiple target elements (all matches get cycled together) |
| `storage-key` | localStorage key the current class value persists under |
| `classes` | Comma-delimited list of classes to cycle through |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/cyclable/class-cycler-button/global.mjs"
></script>
<button
  is="class-cycler-button"
  select="body"
  storage-key="theme"
  classes="light,dark,system"
>
  Toggle theme
</button>
```
