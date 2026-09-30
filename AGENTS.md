# Agent playbook

`@johnhenry/domkit` — a toolkit of ~40 independent DOM/HTML-component
modules (custom elements, shadow-DOM primitives, DOM⇄React interop). One
npm package, one subpath export per module (`"./*": "./src/*"`) — there is
no shared barrel or build step; every module's `src/<module>/index.mjs`
(and sibling files: `global.mjs` for auto-registering scripts, `demo.html`/
`demo.htm`) ships as source, unbundled.

`CLAUDE.md` in this directory is a symlink to this file.

## The verification loop (before every push)

1. `node --check` every `.mjs`/`.js` file you touched — there's no bundler
   to catch a syntax error for you.
2. This package has no DOM test environment configured yet (no jsdom/
   happy-dom) — verify a DOM-touching change against its module's own
   `demo.html`/`demo.htm` in a real browser (`npx http-server .` from the
   repo root, then open `src/<module>/demo.html`), or with a minimal
   `globalThis.HTMLElement`/`document`/`customElements` shim under plain
   Node for import-resolution-level checks only (see how this package's
   own extraction was verified, in the PR that created it).
3. `npm pack --dry-run` — confirm the file list still includes every
   module's real files (nothing accidentally excluded via `.npmignore`/
   `files`).
4. A genuinely fresh clone: `git clone . /tmp/domkit-verifyN && cd $_ && npm ci`.

## Repo-specific gotchas

- **Every module is its own directory under `src/` — no shared version
  subdirectory (`0.0.0/`, `latest/`) the way `johnhenry/lib` (this
  package's origin) uses.** If you're porting something from `lib` or
  comparing against it, remember one directory level was collapsed during
  extraction: `lib`'s `js/<module>/0.0.0/index.mjs` is this package's
  `src/<module>/index.mjs`, and cross-module imports are `../<module>/...`
  here, not `../../​<module>/0.0.0/...`.
- **A minimal fake-`HTMLElement` shim is enough to *import* every module
  in this package under plain Node, but not enough to fully *exercise*
  code that runs at module-evaluation time or that reaches real browser
  module resolution** — this gap has caught two real, previously
  undetected bugs so far. This is why `mounts/last.mjs`'s real
  `unsuitable.contains is not a function` bug (fixed in 0.0.2 — `Array`
  has `.includes()`, not `.contains()`) went undetected: the
  import-resolution smoke test only imports modules, it doesn't run their
  top-level DOM-reading code against a body that actually has element
  children. It's also why three demo files' bare-specifier imports (see
  the import-map gotcha below) weren't caught until a static resolution
  check went looking specifically — Node resolves bare specifiers via
  `node_modules`, masking the exact failure a real browser hits.
- **Several modules have known, documented, *not-yet-fixed* pre-existing
  quirks carried over from `lib`** — check each module's own `readme.md`
  before assuming a given behavior is a bug versus already-known. One
  confirmed example: `xy-grapher/component.mjs` calls a `genSVG()`
  function that's never defined or imported anywhere, so `render()`
  throws — inherited from `lib`, not introduced here. Its `demo.html`
  used to mask this by accidentally registering `chernoff-face`'s
  component under the `xy-grapher` tag (a copy-paste bug); fixed to
  register the real, still-broken component instead of hiding it.
- **`simple-element`/`create-element`/`text-to-DOM-nodes`/
  `DOM-nodes-to-text`/`react-to-dom`/`dom-to-React` are NOT in this
  package** (removed in 0.0.1) — they duplicated
  [`@johnhenry/domable`](https://github.com/johnhenry/domable), a separate,
  more polished package (real TS types, jsdom tests) published two days
  before this package's own extraction from `lib`. domkit depends on it
  directly; import `@johnhenry/domable/<name>`, not a local path, for any
  of those six.
- **`src/definable/`, `src/matchable/`, `src/cyclable/`, `src/hydratable/`
  are namespaced clusters, not flat modules** — each briefly existed as
  its own standalone npm package (`0.0.3`), then got folded back in
  (`0.0.4`) as a subdirectory containing its member modules, one nesting
  level deeper than everything else under `src/`. If you're porting
  something from one of the old standalone repos, or comparing against
  their git history, remember that extra level:
  `<old-repo>/src/<module>/...` is now
  `src/<cluster>/<module>/...` here. `matchable` was `respondable` when it
  was its own package — renamed on the way back in (see README's
  Provenance note for why).
  - `chernoff-face`, `xy-grapher`, and `animate-paths.component` (still
    flat under `src/`) import from `src/definable/` via relative paths
    (e.g. `../definable/definetag/index.mjs`) — not a package dependency.
    Only `@johnhenry/domable` is a real `package.json` dependency now;
    definable/matchable/cyclable/hydratable are internal.
- **A bare specifier like `@johnhenry/domable/simple-element` resolves
  fine under Node (via `node_modules`) but NOT in a real browser with no
  bundler** — browsers can't resolve bare module specifiers without a
  `<script type="importmap">`. Every demo `.html`/`.htm` file that
  transitively imports `@johnhenry/domable/...` needs one, and the
  relative path inside it must count directory levels from *that file's*
  location — `src/definable/<module>/demo.html` needs one more `../` than
  a flat `src/<module>/demo.html` would, and `matchable`'s two demo files
  need their *own* copy of the entry even though they only reach
  `@johnhenry/domable` indirectly through a `definable` module they load,
  because **import maps are per-document and don't inherit across a
  loaded module boundary**, even same-origin. Getting either of these
  wrong is exactly how two real bugs shipped and got caught during the
  `0.0.4` merge — see `demo/fragments/shadow-dom.html`,
  `src/infinite-combo.component/demo.htm`,
  `src/definable/define-component-by-content.component/demo.html`,
  `src/matchable/query-container.component/demo.htm`,
  `src/matchable/attribute-provider.component/demo.htm` for the current,
  correct pattern. domable's package is flat (one `.mjs` file per subpath,
  e.g. `src/simple-element.mjs`) so its import-map entries must be exact
  subpath matches, not a trailing-slash prefix.
- **`matchable/query-sections.mjs` is the one place the `[query] value`
  pipe-delimited grammar is parsed — `query-container.component` and
  `attribute-provider.component` both use it, on purpose.** They used to
  each hand-roll their own copy, which is exactly how they silently
  diverged (0.0.5: `query-container.component` had no fallback for a
  bracket-less section and threw). If you touch this grammar, touch the
  shared parser, not either component's own code — and reuse the `mql` it
  hands back for both state and `.onchange` rather than calling
  `matchMedia()` again; that was the other 0.0.5 lifecycle-cleanup bug.
- **`hydratable`'s `HYDRATED` symbol is `configurable: true` as of
  0.0.5** (it was `false` before, permanently — the whole point of adding
  `dehydrate()` was making it undoable). If you're diffing against an
  older copy of this module elsewhere, don't "fix" this back.
- **`demo/` is a repo-root sibling of `src/`, not published to npm**
  (`files` is still just `["src/"]`). It's a live gallery
  (`demo/index.html`) running most modules simultaneously, each isolated
  in its own iframe — either an existing `src/<cluster>/<module>/demo.html`/
  `demo.htm`, or a small fragment under `demo/fragments/` for modules that
  had none. Requires a static server (`npx http-server .` from the repo
  root, then visit `/demo/`) — module imports don't resolve over
  `file://`. `npx serve .` also works but needs `serve.json`'s
  `cleanUrls: false` (already present) — its default URL rewriting
  otherwise breaks relative module imports on any bare directory URL.
  Add a new module's live example here too, not just its own
  `demo.html`/`demo.htm`, when it's substantial enough to warrant one.
  If a cluster of modules is ever split out into its own package again
  (or merged back in, as happened in `0.0.4`), update its cards/fragments
  here in the same change — don't leave dangling iframe references.

## Definition of done (adding or changing a module)

- `node --check` passes.
- The module's own `readme.md` is accurate (name, description, real
  attributes/API, a working usage example) — this package inherited
  several modules from `lib` whose READMEs didn't match their actual code
  at all; don't reintroduce that here.
- If the module starts any kind of subscription in `connectedCallback`/at
  construction (`MutationObserver`, `addEventListener` on `document`/
  `window`/a shared object, `matchMedia().onchange`), it has a matching
  `disconnectedCallback` that actually stops it — this exact class of bug
  (a "start" with no "stop") was the majority of what the completeness
  audit that shaped this package's initial release found.

## Non-goals

- No bundling/build step is planned — modules ship as source, matching
  how they were always consumed (`lib`'s own raw-URL-import convention,
  now also `npm install` + subpath import).
- A real DOM test environment (jsdom/happy-dom + a test runner) doesn't
  exist yet. Given how many real bugs turned up in code that had never
  been exercised by a test, this is a natural, real follow-up — just not
  part of the initial extraction.
- The visual/canvas experiment modules (`canvasrenderer.component`,
  `animate-paths.component`, `pixelshader.component`,
  `imagedata-emitter.component`, `xy-grapher`, `chernoff-face`, `brains`)
  are demo-grade, not hardened library code — treat them as examples, not
  a stable API, unless/until someone gives them the same documentation
  and correctness pass the rest of this package got.

## Releases

Bump `version` in `package.json` in a PR, add a `CHANGELOG.md` entry,
merge, then `gh release create v<version>` (fires
`.github/workflows/publish.yml`, gated on the full CI suite).
