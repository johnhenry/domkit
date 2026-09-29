# Changelog

All notable changes to this project will be documented in this file.

## [0.0.2] - 2026-09-29

Added `demo/` — a live module gallery (not published to npm; repo-only).
`demo/index.html` runs ~25 of the ~33 modules simultaneously, each in its
own iframe (either an existing per-module `demo.html`/`demo.htm`, reused
as-is, or a small new fragment under `demo/fragments/` for modules that
had none) so unrelated custom elements can't collide by tag name, CSS, or
global state. Requires a static file server (module imports don't resolve
over `file://`) — `npx serve .` from the repo root, then visit `/demo/`.

Building it surfaced one real, previously-undetected bug:

- `src/mounts/last.mjs` called `unsuitable.contains(...)` on a plain
  array — `Array` has no `.contains()` method (that's `Node`/
  `DOMTokenList`), only `.includes()`, which `first.mjs`'s equivalent
  check already used correctly. Importing `last` threw a `TypeError`
  whenever `document.body`'s last child was a real element — i.e. almost
  always. Fixed to `.includes()`.

The four modules with no README or demo file (`canvasrenderer.component`,
`pixelshader.component`, `imagedata-emitter.component`, `brains`) were
deliberately left out of the gallery rather than guessing at an
undocumented API.

## [0.0.1] - 2026-09-29

Removed six foundation modules that duplicated
[`@johnhenry/domable`](https://github.com/johnhenry/domable) — a separate
package, published two days before this one's extraction, that already
consolidated the same six `lib` modules with real TypeScript types and
jsdom-backed tests. The overlap was found while starting this package's
opensource.johnhenry.me docs section, after domkit had already shipped as
`0.0.0`.

- Dropped from `src/`: `simple-element`, `create-element`,
  `text-to-DOM-nodes`, `DOM-nodes-to-text`, `react-to-dom`, `dom-to-React`.
- Added `@johnhenry/domable` as a real dependency; the three internal
  consumers (`shadow-dom.element`, `define-component-by-content.component`,
  `infinite-combo.component`) now import `simple-element`/`text-to-dom`
  directly from it (`@johnhenry/domable/simple-element`,
  `@johnhenry/domable/text-to-dom`).
- README's Foundation and DOM⇄React interop sections updated to point at
  domable instead of listing local copies; added a `## Family` section.
- Everything else — the define-component family, responsive containers,
  shadow/slot widgets, all standalone widgets, `mounts`/`hydratable`,
  `create-mutable-nodelist`, `live-query-selector` — is unaffected; no
  overlap exists there.

## [0.0.0] - 2026-09-29

Initial release. Extracted from [`johnhenry/lib`](https://github.com/johnhenry/lib)'s
`js/` directory (`consolidate/html-components` branch,
[lib#15](https://github.com/johnhenry/lib/pull/15)), where these ~40
modules had accumulated real duplication and drift before a consolidation
pass fixed them in place. `lib`'s own copies are unaffected — this is a
new, separate package, not a move that breaks `lib`'s existing published
URLs.

### Carried over from the `lib` consolidation

- Five real runtime bugs fixed: `react-to-dom` (undeclared `react`
  reference, threw on every call), `dom-to-React` (undeclared `children`
  in the `DocumentFragment` branch; `NamedNodeMap` misused as
  `[name, value]` entries), `query-container.component` (`this.content`
  compared instead of the private field `this.#content`),
  `internal-timer.component` (a mis-cased `disconnectedCallBack` meant
  its cleanup never ran), `define-component-by-content.component`
  (referenced `defineTag` without importing it), `graph.component`
  (constructor never called `super()`).
- New `define-component.component` module (the generic "load a module by
  URL, register it as a custom element" pattern several other modules'
  docs already assumed existed).
- `xy-grapher`/`chernoff-face` deduplicated to use `definetag` instead of
  hand-rolled `customElements.define` wrappers.
- `shadow-dom.element` is a thin alias for `simple-element`'s
  `shadowOpen` (a strict subset of it).
- READMEs rewritten where wrong (`style-headings.component`,
  `polyfill-window.component`, `definetag`, `attribute-provider.component`)
  or missing entirely (most of the standalone widgets).

### Also carried over: a completeness-audit pass fixing five missing lifecycle supplements

Every one of these started a subscription (`MutationObserver`,
`matchMedia().onchange`, a `document`/`globalThis` listener) with no
corresponding code to stop it:

- `attribute-provider.component` already tracked every `MediaQueryList`
  it created in `#mediaMatches` but never read that field anywhere, and
  had no `disconnectedCallback` at all — now clears them on disconnect.
- `query-container.component`'s `disconnectedCallback` only disconnected
  its child-list observer, leaving every `matchMedia().onchange` handler
  attached — now clears them via its existing `#queries` map.
- `stylable-select.component` never disconnected its `MutationObserver`,
  and its `removeEventListener` calls were missing the capture flag its
  `addEventListener` calls used (so, per spec, neither removal actually
  worked) — both fixed.
- `menu-component.component/hash.mjs`'s `attach(menu)` had no `detach(menu)`
  counterpart at all — added one, guarding against clobbering a different
  `onhashchange` handler installed after `attach()` ran.
- `live-query-selector` had no way to ever stop the `MutationObserver` it
  starts internally — added a non-enumerable `stop()` method on the
  returned collection.

### Package structure

- One package, ~40 subpath exports (`"./*": "./src/*"`) rather than one
  package per module — matches how these were always actually consumed
  (by specific file path, never through a shared barrel).
- `query-container.component`'s vendored copy of
  [parsel](https://github.com/LeaVerou/parsel) replaced with the real
  published `parsel-js` npm package as a real dependency.
