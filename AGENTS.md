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
- **`query-container.component` depends on the real `parsel-js` npm
  package**, not a vendored copy (unlike `lib`, which vendors it under
  `vendor/js/parsel/`). If you add another module that needs a real
  third-party dependency, prefer a real npm dependency over vendoring,
  same reasoning.
- **Several modules have known, documented, *not-yet-fixed* pre-existing
  quirks carried over from `lib`** — check each module's own `readme.md`
  before assuming a given behavior is a bug versus already-known. (None
  currently block anything; this note exists so a future audit doesn't
  re-discover the same things from scratch.)
- **`mounts/*.mjs` and a handful of other modules execute real
  DOM-touching code at module-evaluation time** (not just inside a class
  method) — a minimal fake-`HTMLElement` shim is enough to *import* every
  module in this package under plain Node (confirmed during extraction),
  but not enough to fully *exercise* modules like `mounts` that read
  `window.document.body` at the top level. Use a real browser or a real
  DOM library (jsdom/happy-dom) for anything beyond import-resolution
  checks. This exact gap is how `mounts/last.mjs`'s real
  `unsuitable.contains is not a function` bug (fixed in 0.0.2 — `Array`
  has `.includes()`, not `.contains()`) went undetected through the
  import-resolution smoke test the initial extraction relied on: it only
  imports modules, it doesn't run their top-level DOM-reading code against
  a body that actually has element children.
- **`simple-element`/`create-element`/`text-to-DOM-nodes`/
  `DOM-nodes-to-text`/`react-to-dom`/`dom-to-React` are NOT in this
  package** (removed in 0.0.1) — they duplicated
  [`@johnhenry/domable`](https://github.com/johnhenry/domable), a separate,
  more polished package (real TS types, jsdom tests) published two days
  before this package's own extraction from `lib`. domkit depends on it
  directly; import `@johnhenry/domable/<name>`, not a local path, for any
  of those six.
- **`demo/` is a repo-root sibling of `src/`, not published to npm**
  (`files` is still just `["src/"]`). It's a live gallery
  (`demo/index.html`) running most modules simultaneously, each isolated
  in its own iframe — either an existing `src/<module>/demo.html`/
  `demo.htm`, or a small fragment under `demo/fragments/` for modules that
  had none. Requires a static server (`npx serve .` from the repo root,
  then visit `/demo/`) — module imports don't resolve over `file://`.
  Add a new module's live example here too, not just its own
  `demo.html`/`demo.htm`, when it's substantial enough to warrant one.

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
