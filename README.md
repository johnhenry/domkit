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

A toolkit of small, independent DOM/HTML-component modules — custom
elements, shadow-DOM/component-authoring primitives, and DOM⇄React
interop helpers. Each module is its own directory under `src/`, importable
individually:

```js
import { shadowOpen } from "@johnhenry/domkit/simple-element/index.mjs";
```

or, in a browser with no build step, via a CDN:

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/query-container.component/global.mjs"
></script>
```

There is no single root import — this is a toolkit of ~40 independent
things, not one coherent API. Every module's own `readme.md` (linked
below) documents its real usage.

## Install

```bash
npm install @johnhenry/domkit
```

## Modules

### Foundation — component-authoring primitives

| Module | Description |
|---|---|
| [simple-element](src/simple-element/readme.md) | Build custom-element classes from HTML template strings (shadow DOM, slots, `::part()`) |
| [create-element](src/create-element/readme.md) | JSX-less `createElement` + per-tag shorthand exports |
| [text-to-DOM-nodes](src/text-to-DOM-nodes/readme.md) | Parse an HTML string into a `NodeList` |
| [DOM-nodes-to-text](src/DOM-nodes-to-text/readme.md) | The inverse: DOM nodes → HTML string |
| [create-mutable-nodelist](src/create-mutable-nodelist/readme.md) | A push/pop/shift/unshift-able `NodeList`-like collection |
| [live-query-selector](src/live-query-selector/readme.md) | An auto-updating live collection matching a selector |

### Defining custom elements

| Module | Description |
|---|---|
| [definetag](src/definetag/readme.md) | Curried `customElements.define` wrapper |
| [define-component.component](src/define-component.component/readme.md) | Load a module by URL, register its export as a custom element |
| [define-component-by-content.component](src/define-component-by-content.component/readme.md) | Define a custom element from an inline HTML string attribute |
| [polyfill-window.component](src/polyfill-window.component/readme.md) | Load a module by URL, assign its export to a global (not a custom-element registrar) |

### Responsive containers

| Module | Description |
|---|---|
| [query-container.component](src/query-container.component/readme.md) | Swap the rendered child element by media query |
| [attribute-provider.component](src/attribute-provider.component/readme.md) | Apply classes/styles/attributes to children by media query |

### Shadow DOM / slots

| Module | Description |
|---|---|
| [shadow-dom.element](src/shadow-dom.element/readme.md) | Deprecated alias for `simple-element`'s `shadowOpen` |
| [internal-timer.component](src/internal-timer.component/readme.md) | A pause/frame-timer element (shadow-DOM+slot plumbing) |

### Widgets

| Module | Description |
|---|---|
| [class-cycler.component](src/class-cycler.component/readme.md) | Global-function class cycler |
| [class-cycler.button.component](src/class-cycler.button.component/readme.md) | Self-contained button variant |
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

| Module | Description |
|---|---|
| [dom-to-React](src/dom-to-React/readme.md) | Convert a real DOM node into a React-element-shaped object |
| [react-to-dom](src/react-to-dom/readme.md) | The inverse: React-element-shaped object → real DOM |
| [mounts](src/mounts/readme.md) | Framework-agnostic DOM mount-point helpers (Solid/Vue/React) |
| [hydratable](src/hydratable/readme.md) | A generic async hydration mixin |

### Support utilities

`clamp`, `pause`, `pauseframespersecond`, `localstorage-cycler`,
`localstorage-class-cycler` — small helpers a handful of the modules above
depend on. See their own directories.

## License

MIT
