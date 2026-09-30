# Changelog

All notable changes to this project will be documented in this file.

## [0.0.4] - 2026-09-30

Reverses `0.0.3`: the four clusters split out as standalone npm packages
(`@johnhenry/definable`, `@johnhenry/respondable`, `@johnhenry/cyclable`,
`@johnhenry/hydratable`) are folded back into this package as namespaced
subpaths (`src/definable/`, `src/matchable/`, `src/cyclable/`,
`src/hydratable/`) instead. Running four separate repos for clusters this
small — four CI/publish setups, four sets of secrets, four release
cadences to coordinate, four demo galleries to keep in sync — cost more
than it bought. The grouping itself (recognizing these as real families,
not just unrelated widgets) was still worth doing; it just didn't need
four separate npm identities. `@johnhenry/domable` is unaffected by this —
it's genuinely independent (real TS types, jsdom tests, published before
this cluster existed) and stays a real dependency, not folded in.

- `respondable` renamed `matchable` on the way back in — the original name
  read too close to "responsive design," a much more common and
  differently-scoped web term. `matchable` names the actual shared
  mechanism (`matchMedia()`).
- `package.json`: dropped the `@johnhenry/definable` dependency; re-added
  `parsel-js` (only `matchable/query-container.component` needs it, same
  as before the split).
- Fixed the same class of bare-specifier/import-map bug found during the
  `0.0.3` split, now at one directory level deeper: every demo file under
  the four merged clusters that transitively imports
  `@johnhenry/domable/...` needed its import map's relative path
  recomputed for the new nesting (`src/definable/<module>/demo.html` is
  one level deeper than the old standalone `src/<module>/demo.html` was).
  `matchable`'s two demo files also needed their own `@johnhenry/domable`
  import-map entry, since import maps are per-document and don't inherit
  across a loaded module boundary even within the same origin.
- `matchable`'s two demo files' CDN references to `definable`'s modules
  (previously `https://esm.sh/@johnhenry/definable/...`, dating from when
  they were separate packages) now use plain relative paths — they're
  siblings in the same package again, no CDN round-trip needed for local
  development.
- Added `serve.json` (`cleanUrls: false`) — `npx serve .` redirects away
  the trailing path segment on a bare directory URL and breaks relative
  module imports otherwise (same bug found and fixed the same way in
  `@johnhenry/safe-fragment`). `npx http-server .` doesn't have this
  problem and doesn't need the file, but `serve.json` costs nothing to
  keep around for anyone who reaches for `serve` first.
- `demo/` gallery: all four clusters' cards are back, pointing at the new
  `src/<cluster>/<module>/demo.*` paths.
- The four old GitHub repos (`johnhenry/definable`, `johnhenry/respondable`,
  `johnhenry/cyclable`, `johnhenry/hydratable`) are archived (read-only,
  not deleted) and the four old npm packages are `npm deprecate`d, both
  pointing back at this package.

## [0.0.3] - 2026-09-29

Split four more *coherent clusters* (modules that form a real family, not
just unrelated widgets) out of domkit into their own standalone packages —
the same reasoning that moved six foundation modules to `@johnhenry/domable`
in `0.0.1`. domkit is now a smaller, more honest toolkit: what's left is
deliberately one class or function each, with no natural sibling worth its
own package.

- **[`@johnhenry/definable`](https://github.com/johnhenry/definable)** —
  `definetag`, `define-component.component`,
  `define-component-by-content.component`, `polyfill-window.component`.
  Also gained `until-window-load`, a module `polyfill-window.component`'s
  own demo had always referenced but that was never actually migrated out
  of `lib` in the first place — found while porting that demo.
- **[`@johnhenry/respondable`](https://github.com/johnhenry/respondable)**
  — `query-container.component`, `attribute-provider.component`. Their
  demo files previously referenced a `css-model-window` module that was
  similarly never migrated out of `lib` (and itself depends on an
  undocumented `css-model` module) — rather than chase that chain for
  purely decorative window-size display, it was dropped from both demos.
- **[`@johnhenry/cyclable`](https://github.com/johnhenry/cyclable)** —
  `class-cycler.component`, `class-cycler.button.component`,
  `localstorage-class-cycler`, `localstorage-cycler`.
- **[`@johnhenry/hydratable`](https://github.com/johnhenry/hydratable)** —
  `mounts`, `hydratable`.
- `package.json`: added `@johnhenry/definable` as a dependency (`chernoff-face`,
  `xy-grapher`, and `animate-paths.component` still depend on it to
  register themselves); removed `parsel-js` (only `query-container.component`
  used it, and that module is gone).
- Fixed three bare-specifier module resolution bugs that only manifest in
  a real browser, not under Node: `demo/fragments/shadow-dom.html`,
  `src/infinite-combo.component/demo.htm`, `src/chernoff-face/demo.html`,
  `src/chernoff-face/graph.html`, and `src/xy-grapher/demo.html` all
  transitively import `@johnhenry/domable/...`/`@johnhenry/definable/...`
  via bare specifiers, which Node resolves via `node_modules` but a plain
  browser with no bundler cannot resolve without an import map. Added
  `<script type="importmap">` to each. (This is exactly the class of bug
  the local-vs-Node-vs-browser verification gap in `AGENTS.md` warns
  about — caught here by static reasoning, not a live browser test, since
  this sandbox has no working localhost networking.)
- **Found and documented, not fixed**: `xy-grapher/component.mjs` calls a
  `genSVG()` function that is never defined or imported anywhere in this
  package *or* in `johnhenry/lib`'s original source — `render()` throws
  whenever actually invoked. `xy-grapher/demo.html` previously masked this
  entirely: it imported `chernoff-face`'s `define.mjs` (a copy-paste bug)
  and registered *that* component under the `xy-grapher` tag, so the demo
  "worked" while silently never exercising the real, broken component. Demo
  fixed to register the actual `xy-grapher` component with real `data`/
  `xmax`/`ymax` attributes — this surfaces the render bug instead of
  hiding it. Implementing `genSVG` is a real follow-up, not done here.
- `demo/index.html` and `demo/fragments/` updated: cards for all four
  extracted clusters removed (their own repos now carry their demo
  material); a card added noting the `xy-grapher` bug above.

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
