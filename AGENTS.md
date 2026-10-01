# Agent playbook

`@johnhenry/domkit` is a set of small, independent custom elements and DOM
utilities, published as one npm package with no build step. Source under
`src/` *is* what ships. `CLAUDE.md` in this directory is a symlink to this
file.

## Layout

- `src/<module>/`: one directory per module. `index.mjs` is the module's
  default entry (an element class, unregistered, or a function).
  `global.mjs`, where present, registers the element under its documented
  tag. `readme.md` documents it, and `demo.html`/`demo.htm` exercises it.
- `src/<family>/<module>/`: the grouped families `definable/`,
  `matchable/`, `cyclable/`, `hydratable/` (hydratable is both a family and
  a module: `src/hydratable/index.mjs` is the mixin, `mounts/` its sibling),
  and `experimental/`. Each family directory has its own `readme.md`.
- `package.json` `exports`: `@johnhenry/domkit/<path>` maps to
  `src/<path>/index.mjs`, and any `.mjs`/`.css` file is reachable by its
  full path. Adding a module needs no `package.json` change.
- `demo/`: a live gallery (repo-only, not published) running most modules
  at once, each in its own iframe.
- `test/`: behavioral tests (`node:test` + happy-dom). `scripts/`: the
  syntax and reference checkers.

## The contract

[`docs/principles.md`](docs/principles.md) is the bar every stable element
is held to: native-element behavior (attributes ↔ properties, reflection,
`hidden`, native event names, forms), WAI-ARIA patterns, light-DOM styling
with custom properties, composability, lifecycle robustness, and tests in
all three engines. Modules are being upgraded to it one per PR. When a
module and the principles disagree, the module is wrong.

## The verification loop (before every push)

1. `npm test`. It runs, in order:
   - `scripts/check-syntax.mjs`: every `.mjs` under `src/` parses.
   - `scripts/check-links.mjs`: every relative import/`src`/`href` in
     `src/` and `demo/`, every relative Markdown link, and every
     `@johnhenry/domkit/<path>` mentioned in docs or code resolves to a
     real file through the actual `exports` map. **Any rename, move, or
     deletion that leaves a stale reference fails here.**
   - `eslint .`: one rule, `no-undef` (see the gotcha below).
   - `tsc -p test/types`: the generated `.d.mts` declarations type-check
     when consumed through the package's own export paths.
   - `node --test "test/*.test.mjs"`: the fast happy-dom tests.
   Then `npm run test:browser`: Playwright, `test/browser/*.spec.mjs`, in
   Chromium, Firefox, and WebKit, against the real modules served by
   `scripts/serve.mjs`. CI runs both, plus a drift check that
   `npm run manifest` leaves every generated file unchanged.
2. For DOM-touching changes, also check the module's own demo **in a real
   browser**: `npx http-server . -c-1` from the repo root, then
   `/src/<path>/demo.html` and the gallery at `/demo/`. happy-dom isn't a
   browser (see its gotchas below), and several bugs here were only ever
   visible in one.
3. `npm pack --dry-run`: the file list still includes every module's files.
4. A genuinely fresh clone: `git clone . /tmp/domkit-verifyN && cd $_ && npm ci && npm test`.

## Definition of done (adding or changing a module)

- The element meets `docs/principles.md`, and
  `test/browser/<module>.spec.mjs` proves it in all three engines
  (`tabbed-ui.spec.mjs` is the template: ARIA wiring, keyboard, events,
  attribute/property reflection, dynamic children, move/reconnect, every
  creation path, nesting, pre-upgrade readability).
- Its class has JSDoc for the manifest (`@tag`, `@summary`, `@attr`,
  `@fires`, `@cssprop`, `@csspart`, and `@type` on public properties),
  and `npm run manifest` has been run and its output committed. That
  generates `custom-elements.json`, `vscode.html-custom-data.json`, and
  the module's `index.d.mts`/`global.d.mts`. Never edit those by hand.
- `npm test` and `npm run test:browser` pass.
- The module's `readme.md` is accurate: name, what it's for, real
  attributes/API/events, a working example using the package path
  (`@johnhenry/domkit/...` or the esm.sh URL, never `./index.mjs`).
  Inaccurate READMEs inherited from `lib` were this package's most common
  defect. Re-read the code when writing one, and check every claim.
- Anything started in `connectedCallback` or a constructor
  (`MutationObserver`, a listener on `document`/`window`, a `matchMedia`
  listener, a loop) is stopped in `disconnectedCallback` **and restarted
  on reconnect**. Moving an element (`parent.append(el)`) disconnects
  and reconnects it in one task. Both halves of this have shipped broken
  here: no stop (0.0.0), then no restart (fixed 0.0.9 in `matchable` and
  `internal-timer`).
- New element modules get a `global.mjs` registering the module's own name
  as the tag. The two customized built-ins are the exception (see below).
- The root `README.md` table, the family `readme.md` (if any), the gallery
  (`demo/index.html`), and `CHANGELOG.md` are updated in the same change.

## Repo-specific gotchas

- **Playwright's Firefox may not launch on very new macOS** ("Could not
  find profile folder", in or out of a sandbox, even after
  `playwright install --force firefox`). Run
  `npx playwright test --project chromium --project webkit` locally and
  let CI (Ubuntu) cover Firefox.
- **`cem analyze` can't link a class to the tag `global.mjs` registers**
  (the class is an anonymous default export defined in another file), so
  the `@tag` JSDoc is what puts an element in the manifest. It also
  mistakes runtime `customElements.define(name, …)` calls for tags, which
  `scripts/manifest-outputs.mjs` filters out by requiring a valid
  custom-element name. Module order in its output isn't stable, so the
  script sorts it before writing.

- **`no-undef` is the lint rule because undeclared variables are this
  codebase's most-shipped bug.** Under module strict mode they only throw
  when that exact line runs, so they survive `node --check` and casual
  testing: `react` (react-to-dom), `children` (dom-to-React), `cc` and
  `result` (code-color's vendored highlighter, broken since extraction),
  `loadStr` (infinite-combo), `genSVG` (xy-grapher).
- **`@johnhenry/domable`'s `textToDom` returns a `DocumentFragment`, not a
  `NodeList`.** `lib`'s original `text-to-DOM-nodes` returned an iterable
  `NodeList`. When 0.0.1 switched `infinite-combo` to domable's version,
  its `append(...nodes)` started throwing on every search, and nobody
  noticed until 0.0.9. Check return shapes when swapping a dependency.
- **`Event.path` is gone** (Chrome removed it in v109). Use
  `event.composedPath()`. `menu-component/hash.mjs` used `.path` and threw
  on every push/pop until 0.0.9.
- **Customized built-ins don't work in Safari.** `hotkey-modal-dialog`
  (`<dialog is="hotkey-modal">`) and `cyclable/class-cycler-button`
  (`<button is=…>`) are customized built-ins. Their READMEs say so, and
  the root README footnotes them. `hotkey-modal-dialog`'s `global.mjs`
  registers **`hotkey-modal`**, not the module name.
- **happy-dom differs from browsers in ways that matter here** (all
  checked against Chromium during 0.0.9):
  - Its `innerHTML` setter inserts node by node, so custom elements
    connect before their children and later attributes exist. Use
    `render()` from `test/dom.mjs` (template + append, like a browser).
  - It fires `slotchange` synchronously (browsers queue it).
    `menu-component` guards against the resulting re-entrancy.
  - `MediaQueryList`: `onchange` is ignored (use `addEventListener`), and
    `change` only fires when a query *starts* matching. Write viewport
    tests in that direction (see `families.test.mjs`).
  - Customized built-ins never get lifecycle callbacks, so those tests
    are skipped with a reason.
  - `requestAnimationFrame` runs as fast as the CPU allows. Drive frames
    by hand for anything rate-based (see the `internal-timer` test).
- **A hidden browser tab doesn't deliver `requestAnimationFrame` or
  `matchMedia` change events.** When verifying `internal-timer`,
  `frame-delay`, or `matchable` in a real browser, the tab must be visible.
- **`internal-timer` never ticks without light-DOM content.** Its loop
  starts from a `slotchange` on its internal `<slot>`, and an empty element
  never fires one, with no error. Give every consumer some child text.
- **`matchable/query-sections.mjs` is the one place the
  `[query] value | …` grammar is parsed.** `query-container` and
  `attribute-provider` both use it. They once had separate copies that
  silently diverged (0.0.5). Its bracket match is non-greedy on purpose:
  a media query never contains `]`, but a selector value can
  (`ol[data-x=1].wide`).
- **`attribute-provider` replaces children's whole `class` and `style`
  attributes** on every update. That's documented, not a bug. Don't
  "fix" it into a merge without also changing the README and tests.
- **`hydratable`'s `HYDRATED` symbol is `configurable: true`** (0.0.5), so
  that `dehydrate()` can delete it. Don't "fix" it back.
- **`mounts/first.mjs`/`last.mjs` run at import time and skip
  whitespace/comment nodes** (via `skip-insignificant.mjs`) before
  deciding whether `body`'s first/last child is reusable. In any
  normally indented page, the first child is a whitespace text node.
  Test against realistic markup (the test does).
- **Bare specifiers in demos need import maps.** `@johnhenry/domable/*`
  and `parsel-js` resolve under Node via `node_modules`, but not in a
  browser loading raw source. Every demo that transitively imports them
  carries a `<script type="importmap">` whose relative paths count from
  *that file's* directory. Import maps are per document, so each demo
  page and each gallery iframe needs its own. domable's exports are flat files, so map exact
  subpaths (`src/simple-element.mjs`), not a prefix. Working examples:
  `src/infinite-combo/demo.htm`, `src/matchable/*/demo.htm`,
  `src/definable/define-component-by-content/demo.html`,
  `demo/fragments/shadow-dom.html`.
- **Things that are NOT in this package**: `simple-element`,
  `create-element`, `text-to-dom`/`dom-to-text`, `react-to-dom`/
  `dom-to-react` live in `@johnhenry/domable` (removed from here in 0.0.1).
  `brains` (0.0.7) and `graph-component` (0.0.9) were deleted, not moved.
- **Coming from `johnhenry/lib`?** `lib`'s `js/<module>/0.0.0/index.mjs`
  is this repo's `src/<module>/index.mjs` (or
  `src/<family>/<module>/…`), and several modules were renamed since. See
  `CHANGELOG.md`.
- **`npx serve .` breaks relative imports on bare directory URLs** unless
  `cleanUrls` is off. `serve.json` already does that, but
  `npx http-server . -c-1` avoids the issue (and caching) entirely.

## Non-goals

- No bundling or build step. Modules ship as source.
- `experimental/` modules are not held to the definition of done above.
  Graduating one out of `experimental/` means meeting it.
- No TypeScript sources. Type declarations (`.d.ts` next to the `.mjs`)
  would be welcome for the JS-API modules, but none exist yet.

## Releases

Bump `version` in `package.json` in a PR, add a `CHANGELOG.md` entry,
merge, then `gh release create v<version>` (fires
`.github/workflows/publish.yml`, gated on the full CI suite).
