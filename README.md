# domkit

[![npm version](https://img.shields.io/npm/v/%40johnhenry%2Fdomkit.svg)](https://www.npmjs.com/package/@johnhenry/domkit)
[![CI](https://github.com/johnhenry/domkit/actions/workflows/ci.yml/badge.svg)](https://github.com/johnhenry/domkit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40johnhenry%2Fdomkit.svg)](LICENSE)

Full documentation: [opensource.johnhenry.me/domkit](https://opensource.johnhenry.me/domkit/)

> **Provenance:** extracted from [`johnhenry/lib`](https://github.com/johnhenry/lib)'s
> `js/` directory, where these modules lived as individually-versioned,
> hot-linked source files (`js/<module>/0.0.0/...`). Consolidated into one
> real npm package after an audit found real duplication, drift, and
> lifecycle bugs across the cluster — see `CHANGELOG.md` for the full
> history. `lib` itself is unaffected: its own copies of these modules keep
> existing at their original published URLs per its own no-deletion policy.
> Six foundation modules that overlapped with the already-published
> [`@johnhenry/domable`](https://github.com/johnhenry/domable) (`simple-element`,
> `create-element`, `text-to-DOM-nodes`, `DOM-nodes-to-text`, `react-to-dom`,
> `dom-to-React`) were dropped from this package in `0.0.1` in favor of
> depending on domable directly. In `0.0.3`, four more *coherent clusters*
> (modules that form a real family, not just unrelated widgets) were split
> out into their own standalone packages for the same reason:
> [`@johnhenry/definable`](https://github.com/johnhenry/definable) (the
> "define a component declaratively" family),
> [`@johnhenry/respondable`](https://github.com/johnhenry/respondable)
> (media-query-driven responsive containers),
> [`@johnhenry/cyclable`](https://github.com/johnhenry/cyclable) (the
> localStorage class-cycler family), and
> [`@johnhenry/hydratable`](https://github.com/johnhenry/hydratable)
> (`mounts` + `hydratable`). domkit now depends on `definable` for the
> handful of remaining modules that still need it — see `## Family` below.
> What's left in domkit is deliberately a toolkit again: one class or
> function each, no natural sibling worth its own package.

A toolkit of small, independent DOM/HTML-component modules — custom
elements, shadow-DOM/component-authoring primitives, and DOM⇄React
interop helpers. Each module is its own directory under `src/`, importable
individually:

```js
import { shadowOpen } from "@johnhenry/domable/simple-element";
```

or, in a browser with no build step, via a CDN:

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/tabbed-ui.component/global.mjs"
></script>
```

There is no single root import — this is a toolkit of ~40 independent
things, not one coherent API. Every module's own `readme.md` (linked
below) documents its real usage.

See [`demo/`](demo/) for a live gallery running ~25 of these modules at
once (`npx serve .` from the repo root, then visit `/demo/` — module
imports don't resolve over `file://`).

## Install

```bash
npm install @johnhenry/domkit
```

## Modules

### Foundation — component-authoring primitives

`simple-element` (build custom-element classes from HTML template strings),
`create-element` (JSX-less `createElement` + per-tag shorthands),
`text-to-DOM-nodes`/`DOM-nodes-to-text` (HTML string ⇄ real DOM nodes) all
now live in [`@johnhenry/domable`](https://github.com/johnhenry/domable) — a
real dependency of this package — rather than as domkit modules. See
`## Family` below.

| Module | Description |
|---|---|
| [create-mutable-nodelist](src/create-mutable-nodelist/readme.md) | A push/pop/shift/unshift-able `NodeList`-like collection |
| [live-query-selector](src/live-query-selector/readme.md) | An auto-updating live collection matching a selector |

### Defining custom elements

`definetag`, `define-component.component`, `define-component-by-content.component`,
and `polyfill-window.component` all now live in
[`@johnhenry/definable`](https://github.com/johnhenry/definable) — a real
dependency of this package, used internally by `chernoff-face`, `xy-grapher`,
and `animate-paths.component` below to register themselves. See
`## Family` below.

### Responsive containers

`query-container.component` and `attribute-provider.component` now live in
[`@johnhenry/respondable`](https://github.com/johnhenry/respondable). See
`## Family` below.

### Shadow DOM / slots

| Module | Description |
|---|---|
| [shadow-dom.element](src/shadow-dom.element/readme.md) | Deprecated alias for domable's `simple-element` `shadowOpen` |
| [internal-timer.component](src/internal-timer.component/readme.md) | A pause/frame-timer element (shadow-DOM+slot plumbing) |

### Widgets

The localStorage-backed class-cycler family (`class-cycler.component`,
`class-cycler.button.component`, `localstorage-class-cycler`,
`localstorage-cycler`) now lives in
[`@johnhenry/cyclable`](https://github.com/johnhenry/cyclable). See
`## Family` below.

| Module | Description |
|---|---|
| [hotkey-modal.dialog.component](src/hotkey-modal.dialog.component/readme.md) | A `<dialog>` opened/closed by a keyboard shortcut |
| [menu-component.component](src/menu-component.component/readme.md) | Keyboard-navigable stateful menu/wizard, with a `hash.mjs` location-hash companion |
| [stylable-select.component](src/stylable-select.component/readme.md) | A `<select>`-like element whose options can actually be styled |
| [tabbed-ui.component](src/tabbed-ui.component/readme.md) | Tabs/panels element |
| [infinite-combo.component](src/infinite-combo.component/readme.md) | A combo-box that loads more options on demand |
| [event-consumer.component](src/event-consumer.component/readme.md) | Declaratively wire event listeners without JavaScript setup |
| [code-color.component](src/code-color.component/readme.md) | Syntax-highlight contents, re-highlighting on change |
| [graph.component](src/graph.component/readme.md) | Unimplemented placeholder |

### Visual/canvas experiments

`canvasrenderer.component`, `animate-paths.component`, `pixelshader.component`,
`imagedata-emitter.component`, `xy-grapher`, `chernoff-face`, `brains` —
demo/experiment-grade custom elements (canvas rendering, SVG path
animation, pixel shaders, generative graphics). No individual READMEs yet;
see each module's own `demo.html`/`demo.htm`.

### DOM ⇄ React interop

`domToReact`/`reactToDom` (real DOM ⇄ React-element-shaped plain objects)
live in [`@johnhenry/domable`](https://github.com/johnhenry/domable), and
`mounts`/`hydratable` now live in
[`@johnhenry/hydratable`](https://github.com/johnhenry/hydratable) — none
of the DOM⇄React interop story lives in domkit itself anymore. See
`## Family` below.

### Support utilities

`clamp`, `pause`, `pauseframespersecond` — small helpers a handful of the
modules above depend on. See their own directories.

## Family

- [`@johnhenry/domable`](https://github.com/johnhenry/domable) — the DOM
  ⇄ text ⇄ React conversion primitives (`simple-element`, `create-element`,
  `text-to-dom`/`dom-to-text`, `react-to-dom`/`dom-to-react`) that this
  package builds custom elements and interop helpers on top of. domkit
  depends on domable, not the other way around.
- [`@johnhenry/definable`](https://github.com/johnhenry/definable) — the
  "define a component declaratively" family. `chernoff-face`, `xy-grapher`,
  and `animate-paths.component` (still in domkit) depend on it to register
  themselves.
- [`@johnhenry/respondable`](https://github.com/johnhenry/respondable) —
  media-query-driven responsive containers (`query-container.component`,
  `attribute-provider.component`), split out of domkit `0.0.2` into
  `respondable` `0.0.0`. No remaining domkit module depends on it.
- [`@johnhenry/cyclable`](https://github.com/johnhenry/cyclable) — the
  localStorage class-cycler family, split out the same way. No remaining
  domkit module depends on it.
- [`@johnhenry/hydratable`](https://github.com/johnhenry/hydratable) —
  `mounts` + a generic hydration mixin, split out the same way. No
  remaining domkit module depends on it.

## License

MIT
