# define-component-by-content

Register a custom element whose markup you write right there in the
page, in a `<template>`. Every instance of the new tag renders that
markup in a shadow root, so `<slot>`s and scoped `<style>`s work. It's
for markup-only components (a styled callout, a card frame, a signature
line) that don't deserve a JavaScript file. Part of
[definable](../readme.md).

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

## Attributes

| Attribute | Description |
|---|---|
| `name` | Tag name to register |
| `mode` | `open` (default) or `closed` shadow root, or `none` to append the markup to each instance's light DOM (no slots, page styles apply) |
| `content` | The markup as an HTML string, if there's no `<template>` child |

The markup is captured once, when the element first connects. If `name`
is already registered, nothing happens.

## Events

`load` once the tag is registered (or already was), and `error` (an
`ErrorEvent`) for an invalid `name` or `mode`.

Compare [define-component](../define-component/readme.md), which
registers a class from a module, for components with behavior.
