# Changelog

All notable changes to this project will be documented in this file.

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
