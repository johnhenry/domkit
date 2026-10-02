# define-component

Register a custom element from HTML, without writing a script. Name a
tag, then give it one source:

- **A module** (`src`): `<define-component>` imports it and registers
  one of its exports (`import`, default `default`) as the element class.
  The code loads only on pages that use it.
- **Markup** (a `<template>` child, or a `content` attribute): every
  instance of the new tag renders that markup in a shadow root, so
  `<slot>`s and scoped `<style>`s work. It's for markup-only components
  (a styled callout, a card frame, a signature line) that don't deserve
  a JavaScript file.

Part of [definable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"></script>

<!-- from a module's default export -->
<define-component name="fancy-card" src="/components/fancy-card.mjs"></define-component>

<!-- from a named export -->
<define-component name="data-grid" src="/components/grids.mjs" import="DataGrid"></define-component>

<!-- from markup -->
<define-component name="x-callout">
  <template>
    <style>
      :host { display: block; border-inline-start: 4px solid teal; padding: 0 1em; }
    </style>
    <slot></slot>
  </template>
</define-component>

<fancy-card>…</fancy-card>
<x-callout>Heads up!</x-callout>
```

## One source, not both

Use `src` *or* inline markup. An element with both (say, `src` and a
`<template>` child) or with neither registers nothing and fires `error`
with the reason, so a typo can't silently pick one. `import` only
applies with `src`; `mode` only applies to inline markup.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `name` |  | `string` | The tag name to register. |
| `src` |  | `string` | URL of a module exporting the element class, resolved against the document's base URL. Not allowed with inline markup. |
| `import` |  | `string` | With `src`: the name of the export to register. Default `default`. |
| `content` |  | `string` | Inline markup, if there's no `<template>` child. Not allowed with `src`. |
| `mode` |  | `string` | With inline markup: `open` (default) or `closed` shadow root, or `none` to append the markup as light DOM. |

### Properties

| Property | Type | Description |
|---|---|---|
| `ready` (read-only) | `Promise<CustomElementConstructor>` | Resolves with the registered class once the element is defined; rejects if it couldn't be. |

### Events

| Event | Description |
|---|---|
| `load` | The element is registered (or the name already was). |
| `error` | No source or two sources, an invalid name or mode, or (with `src`) the module failed to load, lacked the export, or the export isn't a class. An `ErrorEvent`. |

<!-- api:end -->

## Notes

- The element acts once, when it first connects, and captures inline markup then: later edits to it don't redefine the tag. If `name` is already registered (say, by another `<define-component>`), it does nothing and reports success.
- `src` resolves against the document's base URL, and the `load` and `error` events don't bubble, both like `<script src>`. To wait in script, `await document.querySelector("define-component").ready`.
- `mode="none"` appends the markup to each instance as light DOM (no slots, page styles apply) instead of using a shadow root.
- For an element class you already have in JavaScript, use [definetag](../definetag/readme.md) or `customElements.define` directly.
