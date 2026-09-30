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
> depending on domable directly — domable is genuinely independent (real TS
> types, jsdom tests, published before this cluster existed) and stays its
> own package. In `0.0.3`, four more *coherent clusters* were split out
> into their own standalone packages the same way: `definable`,
> `respondable` (renamed `matchable` on the way back in), `cyclable`, and
> `hydratable`. In `0.0.4`, those four came back — not as separate npm
> packages, but as namespaced subpaths under this one package
> (`src/definable/`, `src/matchable/`, `src/cyclable/`, `src/hydratable/`),
> after living as standalone repos/packages made the operational cost
> (four repos, four CI/publish setups, four sets of secrets, four release
> cadences to coordinate) outweigh the benefit for clusters this small. The
> *grouping itself* — recognizing these as real families instead of an
> undifferentiated pile — was still worth doing; it just didn't need to be
> four separate npm identities. The four old repos are archived, and the
> four old npm packages are deprecated, both pointing back here — see
> `## Family` below for the full account. A naming pass (`0.0.7`) then made
> the `.component` suffix convention consistent everywhere; a follow-up
> pass (`0.0.8`) reversed course and dropped the `.component`/`.element`
> suffix from every module directory entirely (registered custom-element
> tag names were never dotted and are unaffected either way), keeping a
> hyphen in every resulting name — `canvasrenderer` → `canvas-renderer`,
> `pixelshader` → `pixel-shader`, and `graph`/`menu` (no natural word
> break to hyphenate) kept `-component` as a literal suffix word instead
> of a dot, landing `menu.component` back on `menu-component` — this time
> to match its own tag name, not to fix a stutter.

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
  src="https://esm.sh/@johnhenry/domkit/tabbed-ui/global.mjs"
></script>
```

There is no single root import — this is a toolkit of ~40 independent
things, not one coherent API. Every module's own `readme.md` (linked
below) documents its real usage.

See [`demo/`](demo/) for a live gallery running most of these modules at
once (`npx http-server .` from the repo root, then visit `/demo/` — module
imports don't resolve over `file://`; `npx serve .` also works but needs
`cleanUrls: false` in `serve.json`, see AGENTS.md).

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

### Defining custom elements — `src/definable/`

Four related ways to get behavior onto a page declaratively, from four
different kinds of source, plus the primitive they're built on.
`chernoff-face`, `xy-grapher`, and `animate-paths` (below) use
`definetag`/`define-component` to register themselves.

| Module | Description |
|---|---|
| [definetag](src/definable/definetag/readme.md) | Curried `customElements.define` wrapper |
| [define-component](src/definable/define-component/readme.md) | Load a module by URL, register its export as a custom element |
| [define-component-by-content](src/definable/define-component-by-content/readme.md) | Define a custom element from an inline HTML string attribute |
| [polyfill-window](src/definable/polyfill-window/readme.md) | Load a module by URL, assign its export to a global (not a custom-element registrar) |
| [until-window-load](src/definable/until-window-load/readme.md) | Remove a "hidden until loaded" class once `window` fires `load` |

### Responsive containers — `src/matchable/`

Two duals of the same idea — respond to a media query by swapping vs. by
styling — sharing a pipe-delimited query grammar and a real `parsel-js`
dependency.

| Module | Description |
|---|---|
| [query-container](src/matchable/query-container/readme.md) | Swap the rendered child element by media query |
| [attribute-provider](src/matchable/attribute-provider/readme.md) | Apply classes/styles/attributes to children by media query |

### Shadow DOM / slots

| Module | Description |
|---|---|
| [shadow-dom](src/shadow-dom/readme.md) | Deprecated alias for domable's `simple-element` `shadowOpen` |
| [internal-timer](src/internal-timer/readme.md) | A pause/frame-timer element (shadow-DOM+slot plumbing) |

### Widgets

The localStorage-backed class-cycler family lives under `src/cyclable/` —
one engine (`localstorage-cycler`), a class-applying wrapper
(`localstorage-class-cycler`), and two ready-made custom elements built on
it.

| Module | Description |
|---|---|
| [cyclable/class-cycler](src/cyclable/class-cycler/readme.md) | Global-function class cycler |
| [cyclable/class-cycler-button](src/cyclable/class-cycler-button/readme.md) | Self-contained button variant |
| [cyclable/localstorage-class-cycler](src/cyclable/localstorage-class-cycler/readme.md) | Applies a cycled value as a class on a given element |
| [cyclable/localstorage-cycler](src/cyclable/localstorage-cycler/readme.md) | The base engine: cycle a localStorage value through a fixed list |
| [hotkey-modal-dialog](src/hotkey-modal-dialog/readme.md) | A `<dialog>` opened/closed by a keyboard shortcut |
| [menu-component](src/menu-component/readme.md) | Keyboard-navigable stateful menu/wizard, with a `hash.mjs` location-hash companion (registers the `menu-component` tag) |
| [stylable-select](src/stylable-select/readme.md) | A `<select>`-like element whose options can actually be styled |
| [tabbed-ui](src/tabbed-ui/readme.md) | Tabs/panels element |
| [infinite-combo](src/infinite-combo/readme.md) | A combo-box that loads more options on demand |
| [event-consumer](src/event-consumer/readme.md) | Declaratively wire event listeners without JavaScript setup |
| [code-color](src/code-color/readme.md) | Syntax-highlight contents, re-highlighting on change |
| [graph-component](src/graph-component/readme.md) | Unimplemented placeholder |

### Visual/canvas experiments

`canvas-renderer`, `animate-paths`, `pixel-shader`,
`imagedata-emitter`, `xy-grapher`, `chernoff-face` —
demo/experiment-grade custom elements (canvas rendering, SVG path
animation, pixel shaders, generative graphics). No individual READMEs yet;
see each module's own `demo.html`/`demo.htm`.

### DOM ⇄ React interop — `src/hydratable/`

`domToReact`/`reactToDom` (real DOM ⇄ React-element-shaped plain objects)
live in [`@johnhenry/domable`](https://github.com/johnhenry/domable), not
here — see `## Family` below.

| Module | Description |
|---|---|
| [hydratable/mounts](src/hydratable/mounts/readme.md) | Framework-agnostic DOM mount-point helpers (Solid/Vue/React) |
| [hydratable](src/hydratable/readme.md) | A generic async hydration mixin |

### Support utilities

[`clamp`](src/clamp/readme.md), [`delay`](src/delay/readme.md),
[`frame-delay`](src/frame-delay/readme.md) — small helpers a handful of
the modules above depend on.

## Family

- [`@johnhenry/domable`](https://github.com/johnhenry/domable) — the DOM
  ⇄ text ⇄ React conversion primitives (`simple-element`, `create-element`,
  `text-to-dom`/`dom-to-text`, `react-to-dom`/`dom-to-react`) that this
  package builds custom elements and interop helpers on top of. domkit
  depends on domable, not the other way around — domable is genuinely
  independent (real TS types, jsdom tests, its own consumers outside this
  cluster) and stays its own package.
- **`definable`, `matchable`, `cyclable`, `hydratable`** — briefly existed
  as four separate npm packages (`@johnhenry/definable`,
  `@johnhenry/respondable`, `@johnhenry/cyclable`, `@johnhenry/hydratable`;
  `respondable` renamed `matchable` on the way back in — a better fit than
  the earlier "responsive-design"-adjacent name). As of `0.0.4` they're
  namespaced subpaths of this package instead (`src/definable/`,
  `src/matchable/`, `src/cyclable/`, `src/hydratable/`) — the four old
  GitHub repos are archived and the four old npm packages are `npm
  deprecate`d, both pointing back here. Import as
  `@johnhenry/domkit/definable/<module>/...`, etc.

## License

MIT
