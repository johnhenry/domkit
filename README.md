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
Modules are being brought up to it one at a time. `tabbed-ui` is the first.

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
| [infinite-combo](src/infinite-combo/readme.md) | Search-as-you-type combo box, with options from your async function | `<infinite-combo>` |
| [hotkey-modal-dialog](src/hotkey-modal-dialog/readme.md) | A `<dialog>` toggled by a keyboard shortcut ¹ | `<dialog is="hotkey-modal">` |
| [menu-component](src/menu-component/readme.md) | Keyboard-navigable menu that drills into sub-screens, optionally synced to `location.hash` | `<menu-component>` |
| [code-color](src/code-color/readme.md) | Syntax highlighting for HTML, CSS, or JS | `<code-color>` |

### Responding to screen size: [`matchable/`](src/matchable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [query-container](src/matchable/query-container/readme.md) | Change the element that wraps content (`ul` → `ol`, …) by media query | `<query-container>` |
| [attribute-provider](src/matchable/attribute-provider/readme.md) | Change children's classes, styles, and attributes by media query | `<attribute-provider>` |

### Remembering a user's choice (e.g. a theme toggle): [`cyclable/`](src/cyclable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [class-cycler](src/cyclable/class-cycler/readme.md) | A global function that cycles a persisted class | `<class-cycler>` |
| [class-cycler-button](src/cyclable/class-cycler-button/readme.md) | A button that does the same on click ¹ | `<button is="class-cycler-button">` |
| [localstorage-class-cycler](src/cyclable/localstorage-class-cycler/readme.md) | The same, as a JS function | |
| [localstorage-cycler](src/cyclable/localstorage-cycler/readme.md) | The engine: a persisted value with `next`/`previous`/`peek`/`set` | |

### Wiring things up from markup instead of scripts: [`definable/`](src/definable/readme.md)

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [define-component](src/definable/define-component/readme.md) | Register a custom element from a module URL | `<define-component>` |
| [define-component-by-content](src/definable/define-component-by-content/readme.md) | Register a markup-only custom element from an HTML string | `<define-component-by-content>` |
| [polyfill-window](src/definable/polyfill-window/readme.md) | Load a module onto `window` | `<polyfill-window>` |
| [until-window-load](src/definable/until-window-load/readme.md) | Hide content until the page has loaded | (strips the `until-window-load` class) |
| [definetag](src/definable/definetag/readme.md) | Curried `customElements.define` | |
| [event-consumer](src/event-consumer/readme.md) | Handle (and by default stop) events with inline code | `<event-consumer>` |

### Timing, collections, and small helpers

| Module | What it's for | `global.mjs` registers |
|---|---|---|
| [delay](src/delay/readme.md) | `await delay(ms)` | |
| [frame-delay](src/frame-delay/readme.md) | `await frameDelay(fps)`: an animation-frame-paced wait | |
| [internal-timer](src/internal-timer/readme.md) | An element that emits `tick` events at a fixed rate, with pause/resume | `<internal-timer>` |
| [live-query-selector](src/live-query-selector/readme.md) | `querySelectorAll` that stays current | |
| [create-mutable-nodelist](src/create-mutable-nodelist/readme.md) | A real `NodeList` you can push to and pop from | |
| [clamp](src/clamp/readme.md) | `clamp(min, max)(value)` | |

### Bootstrapping an app: [`hydratable/`](src/hydratable/readme.md)

| Module | What it's for |
|---|---|
| [hydratable](src/hydratable/readme.md) | A run-once async `hydrate()` (with `dehydrate()` to undo it) for any object |
| [hydratable/mounts](src/hydratable/mounts/readme.md) | Find or create the element at the start/end of `<body>` to render an app into |

### Experimental: [`experimental/`](src/experimental/readme.md)

Sketches without the stable modules' guarantees. Their APIs can change in
any release. A composable canvas pixel pipeline
([imagedata-emitter](src/experimental/imagedata-emitter/readme.md) →
[pixel-shader](src/experimental/pixel-shader/readme.md) →
[canvas-renderer](src/experimental/canvas-renderer/readme.md)),
[animate-paths](src/experimental/animate-paths/readme.md) (self-drawing
SVG), [xy-grapher](src/experimental/xy-grapher/readme.md) (CSS scatter
plots), and [chernoff-face](src/experimental/chernoff-face/readme.md).

### Deprecated

[shadow-dom](src/shadow-dom/readme.md) is an alias for
[`@johnhenry/domable`](https://github.com/johnhenry/domable)'s
`` shadowOpen`<slot />` ``. Use domable directly.

¹ A *customized built-in* (`is="…"`). These work in Chromium and Firefox
but **not Safari**, unless you add a polyfill such as
[`@ungap/custom-elements`](https://github.com/ungap/custom-elements).

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

### Using the raw source without a CDN or bundler

Three modules import packages by bare name: `infinite-combo`,
`shadow-dom`, and `definable/define-component-by-content` import
[`@johnhenry/domable`](https://github.com/johnhenry/domable), and
`matchable/query-container` imports `parsel-js`. esm.sh and bundlers
resolve those for you. To serve `src/` directly to a browser, add an
[import map](https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap)
like the one in [`src/infinite-combo/demo.htm`](src/infinite-combo/demo.htm).

### Content-Security-Policy

`event-consumer` and `infinite-combo` compile their inline-code attributes
with `new Function`, so they need `unsafe-eval` under a strict CSP. No
other stable module evaluates strings.

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
typed. The manifest, types, and editor data cover each element as it's
brought up to [the principles](docs/principles.md), currently `tabbed-ui`.

## Stability

Everything outside `experimental/` is meant to be relied on: documented,
covered by the test suite, and changed only with a `CHANGELOG.md` entry.
The package is still pre-1.0, so a minor-looking version bump can contain
breaking changes (renames have happened). Read the changelog when
upgrading.

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

then open `http://localhost:4173/demo/`. Module imports don't resolve over
`file://`. Each module directory also has its own `demo.html`/`demo.htm`.
See [`AGENTS.md`](AGENTS.md) for the full verification loop and the
repo's known gotchas.

## Related

- [`@johnhenry/domable`](https://github.com/johnhenry/domable) converts
  between HTML text, DOM nodes, and React-element-shaped objects, and
  builds custom-element classes from HTML strings. domkit depends on it.

## History

domkit was extracted from [`johnhenry/lib`](https://github.com/johnhenry/lib),
a personal collection of hot-linked modules, in September 2026, and
consolidated along the way: duplicates of domable were dropped, related
modules were grouped into families, and a series of bugs were fixed (most
of them found by actually running the modules). [`CHANGELOG.md`](CHANGELOG.md)
has the whole story.

## License

MIT
