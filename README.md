# domkit

[![npm version](https://img.shields.io/npm/v/%40johnhenry%2Fdomkit.svg)](https://www.npmjs.com/package/@johnhenry/domkit)
[![CI](https://github.com/johnhenry/domkit/actions/workflows/ci.yml/badge.svg)](https://github.com/johnhenry/domkit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40johnhenry%2Fdomkit.svg)](LICENSE)

Small custom elements and DOM utilities that work straight from a CDN,
with no build step and no framework. Every module is independent, so you
load only what you use.

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/tabbed-ui/global.mjs"></script>

<tabbed-ui>
  <div><button>One</button><button>Two</button></div>
  <section>First panel</section>
  <section>Second panel</section>
</tabbed-ui>
```

Every element is held to the same contract: it behaves like a native
HTML element (attributes, properties, events, forms, `hidden`, keyboard,
and accessibility all work the way they do for built-ins), and it's tested
in Chromium, Firefox, and WebKit. See [`docs/principles.md`](docs/principles.md).
Every stable element meets it.

Full documentation: [opensource.johnhenry.me/domkit](https://opensource.johnhenry.me/domkit/)
· Live gallery: [`demo/`](demo/) (see [Development](#development))

## Install

```bash
npm install @johnhenry/domkit
```

```js
import "@johnhenry/domkit/tabbed-ui/global.mjs"; // registers <tabbed-ui>
import TabbedUI from "@johnhenry/domkit/tabbed-ui"; // or just the class
import liveQuerySelector from "@johnhenry/domkit/live-query-selector";
```

Or skip installing: every path above also works as
`https://esm.sh/@johnhenry/domkit/<path>`.

## Find what you need

### Interface pieces

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [tabbed-ui](src/tabbed-ui/readme.md) | Tabs and panels from plain children, matched by position | `<tabbed-ui>` |
| [stylable-select](src/stylable-select/readme.md) | A listbox whose options you can fully style | `<stylable-select>` |
| [infinite-combo-box](src/infinite-combo-box/readme.md) | Autocomplete with paged ("infinite") results: filters its own options, or searches a URL or function as you type | `<infinite-combo-box>` |
| [hot-key](src/hot-key/readme.md) | Keyboard shortcuts (`mod+k`, `/`) that toggle a native `<dialog>` or popover, or run any invoker command | `<hot-key>` |
| [drill-menu](src/drill-menu/readme.md) | A list that drills into sub-screens and back (settings menus, mobile nav), optionally synced to the URL hash | `<drill-menu>` |
| [code-color](src/code-color/readme.md) | Syntax highlighting (JS, CSS, HTML) that never changes your markup, themable with CSS | `<code-color>` |

### Responding to screen size: [`matchable/`](src/matchable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [query-container](src/matchable/query-container/readme.md) | Change the element that wraps content (`ul` → `ol`, …) by media query | `<query-container>` |
| [attribute-provider](src/matchable/attribute-provider/readme.md) | Change children's classes, styles, and attributes by media query | `<attribute-provider>` |

Both also have a **container mode** (`container` attribute): the same
queries, evaluated against an element's size instead of the viewport.

### Remembering a user's choice (e.g. a theme toggle): [`cyclable/`](src/cyclable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [attribute-cycler](src/cyclable/attribute-cycler/readme.md) | Buttons that cycle a persisted class or attribute (theme, density), synced across tabs | `<attribute-cycler>` |
| [localstorage-attribute-cycler](src/cyclable/localstorage-attribute-cycler/readme.md) | The same, as a JS function | |
| [localstorage-cycler](src/cyclable/localstorage-cycler/readme.md) | The engine: a persisted value with `next`/`previous`/`peek`/`set` | |

### Wiring things up from markup instead of scripts: [`definable/`](src/definable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [define-component](src/definable/define-component/readme.md) | Register a custom element from a module URL or from inline markup | `<define-component>` |
| [polyfill-window](src/definable/polyfill-window/readme.md) | Load a module onto `window` | `<polyfill-window>` |
| [until-window-load](src/definable/until-window-load/readme.md) | Hide content until the page and its `<define-component>`s have loaded | (strips the `until-window-load` class) |
| [definetag](src/definable/definetag/readme.md) | Curried `customElements.define` | |

### Timing, collections, and small helpers

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [delay](src/delay/readme.md) | `await delay(ms)`, or `await delay({ fps })` to wait one frame period on an animation frame | |
| [frame-timer](src/frame-timer/readme.md) | A clock element: steady `tick` events with `play()`/`pause()`, like a media element | `<frame-timer>` |
| [live-query-selector](src/live-query-selector/readme.md) | `querySelectorAll` that stays current, with a `change` event | |
| [clamp](src/clamp/readme.md) | `clamp(min, max)(value)` | |

### Bootstrapping an app: [`hydratable/`](src/hydratable/readme.md)

| Module | What it's for |
|---|---|
| [hydratable](src/hydratable/readme.md) | A run-once async `hydrate()` (with `dehydrate()` to undo it) for any object |
| [hydratable/mounts](src/hydratable/mounts/readme.md) | Find or create the element at the start/end of `<body>` to render an app into |

### Data and graphics

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [scatter-plot](src/scatter-plot/readme.md) | A scatter plot of a point you design, styled with ordinary CSS | `<scatter-plot>` |
| [chernoff-face](src/chernoff-face/readme.md) | A face whose features show data, each a number from 0 to 1 | `<chernoff-face>` |

### Experimental: [`experimental/`](src/experimental/readme.md)

Sketches without the stable modules' guarantees. Their APIs can change in
any release. A composable canvas pixel pipeline
([imagedata-emitter](src/experimental/imagedata-emitter/readme.md) →
[pixel-shader](src/experimental/pixel-shader/readme.md) →
[canvas-renderer](src/experimental/canvas-renderer/readme.md)),
[animate-paths](src/experimental/animate-paths/readme.md) (self-drawing
SVG).

## Recipes

Complete pages in [`examples/`](examples/) that combine modules the way a
real site would. Each is plain HTML you can read top to bottom:

- [Theme switcher](examples/theme-switcher.html): `attribute-cycler` +
  `color-scheme`, synced across tabs.
- [Command palette](examples/command-palette.html): `hot-key` +
  `infinite-combo-box` on ⌘K.
- [Settings panel](examples/settings-panel.html): one `<form>` across
  `drill-menu` screens, with `stylable-select`, `infinite-combo-box`, and
  `attribute-cycler` submitting like native controls.
- [Documentation page](examples/documentation-page.html): `tabbed-ui` code
  samples highlighted by `code-color`, plus `query-container`.
- [Game loop](examples/game-loop.html): `frame-timer` driving an
  animation.

## How the package is laid out

- **One directory per module**, under `src/`. Related modules are grouped
  one level deeper (`matchable/`, `cyclable/`, `definable/`,
  `hydratable/`, `experimental/`), and the group is part of the import
  path.
- **`@johnhenry/domkit/<module>`** imports the module's `index.mjs`: an
  element class (unregistered) or a function. Any file inside can be
  imported by its full path, e.g. `@johnhenry/domkit/tabbed-ui/global.mjs`.
- **`global.mjs`** registers the element under the tag in the tables
  above. Import the class instead if you want a different tag name.
- **No root import.** `import "@johnhenry/domkit"` doesn't exist, on
  purpose. These modules share no state or API, and a barrel would make
  every page download all of them, especially from a CDN where nothing
  tree-shakes.
- **Source is what ships.** There's no build step: modern JS, ES modules
  only.

### No dependencies

domkit has no runtime dependencies, so you can serve `src/` directly, copy
a module's directory into your project, or load it from any CDN, with no
import map and no build step.

### Content-Security-Policy

No module evaluates strings as code, so domkit works under a strict
Content-Security-Policy.

### Theming

Every element's optional `index.css` reads one shared set of design
tokens (accent, highlight, border, radius, focus ring, popup surface,
disabled opacity). Load `theme.css` for ready-made, `light-dark()`-aware
values, or set the tokens yourself to theme every element at once:

```html
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/theme.css" />
<style>
  :root { --domkit-accent: rebeccapurple; --domkit-radius: 0; }
</style>
```

### Editor support

The package ships [`custom-elements.json`](custom-elements.json), a
standard manifest of every element's tag, attributes, properties, events,
and CSS custom properties. Tools that read it (Storybook, many IDE
plugins) work out of the box. For VS Code's HTML autocomplete and hover
docs, add the generated data file to your settings:

```json
{ "html.customData": ["./node_modules/@johnhenry/domkit/vscode.html-custom-data.json"] }
```

TypeScript users get declarations for each element class and its
`HTMLElementTagNameMap` entry, so `document.querySelector("tabbed-ui")` is
typed, and the plain-function modules have declarations too.

The generated [element reference](docs/reference.md) lists every
attribute, property, method, event, and CSS custom property.

## Stability

Everything outside `experimental/` is stable: documented, held to
[the principles](docs/principles.md), tested in Chromium, Firefox, and
WebKit, and versioned with semver. While the version is `0.x`, a breaking
change can only land in a minor release (`0.1` → `0.2`), never a patch,
and it's always listed in [`CHANGELOG.md`](CHANGELOG.md) under
**Changed (breaking)**.

## Development

```bash
npm test
```

This runs, in order: a parse check of every module
(`scripts/check-syntax.mjs`), a reference check that every relative
import, Markdown link, and documented `@johnhenry/domkit/…` path resolves
(`scripts/check-links.mjs`), ESLint's `no-undef` rule (the one rule
configured, see `eslint.config.mjs`), a TypeScript check of the generated
declarations, and the fast behavioral tests in `test/` under
[happy-dom](https://github.com/capricorn86/happy-dom).

```bash
npx playwright install   # once
npm run test:browser     # test/browser/, in Chromium, Firefox, and WebKit
npm run manifest         # regenerate custom-elements.json, types, editor data
```

The live gallery runs most modules at once, each in its own iframe:

```bash
npm run serve
```

then open `http://localhost:4719/demo/`. Module imports don't resolve over
`file://`. Each module directory also has its own `demo.html`/`demo.htm`.
See [`AGENTS.md`](AGENTS.md) for the full verification loop and the
repo's known gotchas.

## Related

- [`@johnhenry/domable`](https://github.com/johnhenry/domable) converts
  between HTML text, DOM nodes, and React-element-shaped objects, and
  builds custom-element classes from HTML strings. domkit used to depend
  on it, and is now dependency-free.

## History

domkit was extracted from [`johnhenry/lib`](https://github.com/johnhenry/lib),
a personal collection of hot-linked modules, in September 2026, and
consolidated along the way: duplicates of domable were dropped, related
modules were grouped into families, and a series of bugs were fixed (most
of them found by actually running the modules). [`CHANGELOG.md`](CHANGELOG.md)
has the whole story.

## License

MIT
