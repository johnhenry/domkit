# define-component-by-content

Register a custom element whose markup you write right there in the
page, in a `<template>`. Every instance of the new tag renders that
markup in a shadow root, so `<slot>`s and scoped `<style>`s work. It's
for markup-only components (a styled callout, a card frame, a signature
line) that don't deserve a JavaScript file. Part of
[definable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component-by-content/global.mjs"></script>

<define-component-by-content name="x-callout">
  <template>
    <style>
      :host { display: block; border-inline-start: 4px solid teal; padding: 0 1em; }
    </style>
    <slot></slot>
  </template>
</define-component-by-content>

<x-callout>Heads up!</x-callout>
```

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `name` |  | `string` | The tag name to register. |
| `content` |  | `string` | The markup, if there's no `<template>` child. |
| `mode` |  | `string` | `open` (default) or `closed` shadow root, or `none` to append the markup as light DOM. |

### Events

| Event | Description |
|---|---|
| `load` | The element is registered (or the name already was). |
| `error` | Missing/invalid name or mode. An `ErrorEvent`. |

<!-- api:end -->

## Notes

- The markup is captured once, when the element first connects. If `name` is already registered, nothing happens.
- Compare [define-component](../define-component/readme.md), which registers a class from a module, for components with behavior.
