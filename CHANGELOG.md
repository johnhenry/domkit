# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed (breaking)

- **`localstorage-cycler` no longer stores the default on creation**, so
  "nothing chosen yet" is a real state, and stepping from it moves to the
  second value (it used to stay on the first).

- **`query-container`'s internal methods are private.** `setInitial()`,
  `setQueries()`, `triggerQuery()`, and `update()` are gone; set the
  `default` and `query` attributes, or the new matching properties (`default`, `query`).

- **`hotkey-dialog` is now `<hot-key>`** (module
  `@johnhenry/domkit/hot-key`). It toggles a `<dialog>` or popover, or
  runs any invoker command, so the old name undersold it. Attributes,
  properties, and methods are unchanged.

- **`class-cycler` is now `<attribute-cycler>`, and can set any
  attribute.** Module `@johnhenry/domkit/cyclable/attribute-cycler`.
  `classes` is renamed `values`. The new `attribute` attribute (default
  `class`) chooses what's set on the targets: one class among their
  others, as before, or another attribute's whole value
  (`attribute="data-theme"`), with an empty value removing it. The
  function `localstorage-class-cycler` is likewise
  `localstorage-attribute-cycler`, now called as
  `(targets, key, values, { attribute })`.

- **`frame-delay` is merged into `delay`.** `await delay({ fps: 30 })`
  waits one frame period on an animation frame, as `frameDelay(30)` did;
  `delay()` and `delay(ms)` are unchanged. An invalid `fps` now rejects
  instead of throwing.
- **`create-mutable-nodelist` is removed, and `live-query-selector`
  returns a plain array that fires `change`.** The `useNodeList` argument
  is gone. Listen with `list.addEventListener("change", …)` instead of
  re-reading after a microtask.

- **`define-component-by-content` is merged into `<define-component>`.**
  One element now registers a tag either from a module (`src`, with
  `import` naming the export, default `default`) or from markup in the
  page (a `<template>` child or a `content` attribute, with `mode`).
  Giving both, or neither, fires `error`. Both kinds have the `ready`
  promise. The `define-component-by-content` module and tag are gone:
  rename the tag to `define-component`.

- **`combo-box` is now `<infinite-combo-box>`** (module
  `@johnhenry/domkit/infinite-combo-box`), named for its new paging.

- **Element stylesheets share one set of design tokens**
  (`--domkit-accent`, `--domkit-highlight`, `--domkit-border`,
  `--domkit-radius`, `--domkit-focus-ring`, `--domkit-surface`,
  `--domkit-surface-text`, `--domkit-disabled-opacity`). These replace
  `--domkit-tab-accent`, `--domkit-tab-border`, `--domkit-select-accent`,
  and `--domkit-combo-accent`.

### Added

- **`pixelable/`: pixel effects on any image, video, or canvas, in
  HTML.** Wrap the source in effects and those in a `<pixel-canvas>`:
  `<pixel-mosaic>` (pixelate), `<pixel-palette>` (named palettes such as
  `gameboy`, `pico-8`, `1bit`, or any CSS colors, with Floyd–Steinberg or
  ordered dithering), and `<pixel-grid>`, applied innermost first, each
  switchable with `disabled`. `<pixel-canvas>` redraws on load, on
  changes, and every frame of a playing video; takes a working `width`;
  is named from the source's `alt`; offers `toBlob()`/`toDataURL()`; and
  shows the original if the source can't be read. Write your own effect
  with `definePixelFilter()` or the `PixelFilter` class. This replaces
  `experimental/imagedata-emitter`, `pixel-shader`, and
  `canvas-renderer`. With that, `experimental/` is gone: everything in the
  package is stable.

- **`<draw-svg>`** replaces `experimental/animate-paths`: strokes of the
  wrapped SVG draw themselves in via `pathLength="1"` and the Web
  Animations API (no generated styles or inline code, so CSP-safe).
  `duration`, `delay`, `stagger`, `easing`, `iterations`, `direction`,
  `erase`, `select`, and `start="visible"`; `play()`/`pause()`/`restart()`
  with `play`/`pause`/`ended` events and `--play`/`--pause`/`--toggle`/
  `--restart` commands. Reduced motion shows it drawn; removal restores
  the SVG as written.

- **`<chernoff-face>`** graduates from `experimental/`, redesigned for
  data: ten features (`face-width`, `eye-size`, `eye-spacing`,
  `pupil-size`, `gaze`, `brow-slant`, `nose-length`, `mouth-width`,
  `smile`, `mouth-open`), each a number from 0 to 1 with 0.5 neutral,
  replacing the raw SVG coordinates. A `features` property, an SVG in the
  light DOM updated in place, `role="img"` with a generated label, and it
  works as a `<scatter-plot>` point.

- **`<scatter-plot>`** graduates from `experimental/xy-grapher`: data
  (`[x, y]` pairs or `{ x, y, …attributes }`, as a JSON attribute or a
  `data` property) plotted as copies of a `<template>` point, in the light
  DOM. `x-min`/`x-max`/`y-min`/`y-max` default to the data; `domain` and
  `points` are readable; bad JSON fires `error`. It's `role="img"` with a
  generated summary label unless you write one, and a 150px block even
  without CSS. `experimental/xy-grapher` is removed.

- **`stylable-select` gains `add()`, `remove(index)`, and `namedItem()`**,
  matching `HTMLSelectElement` (`remove()` with no argument still removes
  the element). Like a native single select, a newly inserted selected
  option now becomes the selection.

- **`delay` can be cancelled**: pass `{ signal }` (or `{ fps, signal }`)
  and aborting clears the timer or animation frame and rejects with
  `signal.reason`. **`live-query-selector` can watch attributes**:
  `{ attributes: true }` or `{ attributes: ["class"] }` picks up elements
  that start or stop matching because an attribute changed.

- **`<tabbed-ui>` and `<frame-timer>` take invoker commands.**
  `tabbed-ui` gains `next()`/`previous()` and `--next`, `--previous`, and
  `--select` (index from the button's `value`), so wizard buttons need no
  script; `frame-timer` takes `--play`, `--pause`, and `--toggle`. The
  game-loop recipe's button now uses `--toggle`.

- **Forgetting a choice in `cyclable`.** `<attribute-cycler>` gains
  `reset()`, a `--reset` command, and `<button data-cycle="reset">`, which
  remove the stored value and go back to the default (also followed
  across tabs). `localstorage-cycler` gains `reset()`, follows other tabs
  through `storage` events like the element does, and `stop()` ends that.

- **`query-container` and `attribute-provider` report their state.** A
  read-only `activeQueries` lists the queries that currently match, and a
  `change` event fires when the viewport or container makes one start or
  stop matching. `query-container` also gains `default`, `query`, and
  `wrapper` properties.

- **`until-window-load` waits for components loaded from HTML.** It now
  removes its class only once the window has loaded *and* every
  `<define-component>` and `<polyfill-window>` has finished (succeeded or
  failed), so content isn't revealed before its components exist. The
  function returns a promise that resolves when the classes are removed.

- **`<hotkey-dialog>` toggles popovers, and runs invoker commands.** A
  `[popover]` child works like a `<dialog>` child (`target` and `open`
  are new). With `commandfor` and `command`, the shortcut acts like a
  button with those attributes: built-in commands (`show-modal`,
  `toggle-popover`, …) run directly, and custom `--commands` are sent as
  `command` events, so a shortcut can drive `<class-cycler>`'s `--next`
  or `<drill-menu>`'s `--back`.

- **`theme.css`** (`@johnhenry/domkit/theme.css`): ready-made,
  `light-dark()`-aware values for the shared tokens. Every `index.css`
  also works without it.
- **`disabled` on `tabbed-ui`, `drill-menu`, `class-cycler`, and
  `hotkey-dialog`**, meaning the same thing as everywhere else: no user
  interaction, out of the tab order, no events, still announced.
- **One option API** for `stylable-select` and `infinite-combo-box`:
  `selectedOption` on the select, and `selectedOptions`, `selectedIndex`
  (get/set), `length`, and `item()` on the combo box.

- **Paged ("infinite") results in `infinite-combo-box`.** A source can
  return `{ options, next, total }`, and the list then loads the next page
  when its end scrolls into view, when the keyboard reaches it, or when
  "Load more results" (the last option) is chosen.
  - `src` takes a `{cursor}` placeholder, and HTML responses can carry
    the cursor on a `data-next` element. `searchFunction` receives
    `{ cursor, signal }`.
  - `page-size` pages through the element's own options.
  - A new query aborts in-flight pages, so stale pages never appear, and
    a failed page fires `error` without retrying in a loop.
  - Options get `aria-setsize`/`aria-posinset`, the list gets
    `aria-busy` while loading, and each page is announced.
  - New `hasMore` and `loadMore()`.

- **Container mode for `matchable`.** A `container` attribute on
  `query-container` and `attribute-provider` evaluates their queries
  against an element's size instead of the viewport: the parent, or the
  closest ancestor matching a selector (`container=".card"`). The grammar
  covers `min-`/`max-` width and height (and logical sizes), range syntax
  (`400px <= width < 800px`), `orientation`, `aspect-ratio`,
  `and`/`or`/`not`/commas, and `px`/`em`/`rem`. Sizes are tracked with one
  shared `ResizeObserver`, containers are unobserved when nothing listens,
  and the container is looked up again after a move.
  `matchable/container-query.mjs` exports the evaluator (`compileQuery`)
  and the `MediaQueryList`-shaped `ContainerQueryList`.

- **Accessibility audits** (axe-core) in the browser suite: every element at
  rest, open/active, and disabled, plus every recipe page.
- **Generated API sections in every element README.** Attribute (with
  matching property), property, method, event, and CSS-custom-property
  tables now come from the JSDoc, like `docs/reference.md`, so they can't
  drift. Every element README follows one structure (Usage, guide
  sections, API, Keyboard, Styling, Notes), enforced by the reference
  checker.

- **Translatable strings in `infinite-combo-box`.** Every shown or
  announced string can be replaced via a `strings` property or an inert
  `<script type="application/json" data-strings>` child, with plural
  maps (`Intl.PluralRules`) and locale number formatting for the
  element's `lang`. `DEFAULT_STRINGS` is exported.
- **Validation messages are the browser's own** in `infinite-combo-box`
  and `stylable-select`, so they're localized like native controls,
  instead of hard-coded English.
- **`infinite-combo-box`'s list floats in the top layer** (a manual
  popover): ancestors with `overflow: hidden`, `z-index`, or transforms
  no longer clip or cover it. It's positioned under the input (flipping
  above when needed, `[data-placement]`), matches the input's width,
  follows scrolling, and needs no stylesheet. The new `inline` attribute
  keeps the in-flow list (used by the command-palette recipe).

### Fixed

- **`option.selected = …` on a `stylable-select` option updates its form
  value**, and in single mode deselects the others, as in a native
  `<select>`. Found by the new native-parity test, which checks that
  `stylable-select` and a native listbox `<select>` (with
  `appearance: base-select`) agree, so moving to the native element
  later is a tag rename. The readme explains the move.

- **`infinite-combo-box` starts new results at the top.** It kept the
  previous scroll position, which could leave "Load more" in view and
  fetch a second page nobody asked for (seen in Firefox).

- **`stylable-select` is labelled for every tool**: it mirrors its
  `<label>`s into `aria-labelledby`, as `infinite-combo-box` already did.
  Browsers followed `<label for>`, but some assistive technology and
  auditing tools don't.
- **Scrollable code blocks are keyboard-reachable**: `code-color` makes a
  `<pre>` focusable while it overflows (WCAG 2.1.1).
- **Right-to-left:** ←/→ now follow the reading direction in `tabbed-ui`
  and `drill-menu`, and `drill-menu`'s chevron mirrors.

## [0.1.0] - 2026-09-30

The library-wide upgrade, and the first release with a stability
commitment. Every stable element was rebuilt against a written contract
([`docs/principles.md`](docs/principles.md)): it behaves like a native HTML
element, works with forms and assistive technology, and is tested in
Chromium, Firefox, and WebKit. Elements also compose with each other
(see `examples/`). domkit now has zero dependencies, ships types and
editor data, and generates its reference from the code. From this
release on, stable modules follow semver: breaking changes only in a
minor version while pre-1.0, always listed under **Changed (breaking)**.

### Added

- **`docs/principles.md`**: the contract for every stable element. It
  covers native-element behavior (attribute ↔ property mirroring,
  reflection, `hidden`, native event names and semantics, form
  participation), WAI-ARIA patterns, light-DOM styling with custom
  properties, cross-module contracts, lifecycle robustness, and
  verification in every engine.
- **Browser tests** (`npm run test:browser`): Playwright in Chromium,
  Firefox, and WebKit, against the real modules served by the new
  dependency-free `scripts/serve.mjs` (`npm run serve`). CI installs the
  browsers and runs them.
- **`custom-elements.json`** (`npm run manifest`), published and declared
  in `package.json`'s `customElements` field, plus files generated from
  it: `vscode.html-custom-data.json` (VS Code HTML autocomplete and hover
  docs) and per-element TypeScript declarations (`index.d.mts`,
  `global.d.mts`, and `HTMLElementTagNameMap` entries). CI fails if any
  of them is stale. `tsc -p test/types` checks the declarations through
  the package's own export paths.

### Changed (breaking)

- **`tabbed-ui`, rebuilt** to the principles:
  - Implements the WAI-ARIA tabs pattern: `tablist`/`tab`/`tabpanel`
    roles, generated ids with `aria-controls`/`aria-labelledby`,
    `aria-selected`, and roving `tabindex`.
  - Keyboard: arrows (or up/down with `aria-orientation="vertical"`),
    `Home`/`End`, disabled tabs skipped, and a `manual` activation mode.
  - Panels are hidden with the `hidden` attribute instead of inline
    `display`.
  - New `selected-index` attribute and `selectedIndex` property, which
    reflect the selection. A `change` event fires on user selection only.
  - Tabs and panels added later are wired up, and the element is safe to
    move.
  - New optional `index.css`, themed with custom properties.
  - Removed: `slot="tab-bar"` (the tab list is the `role="tablist"` child,
    else the first child), `data-default-index` (use `selected-index`),
    `data-display` (panels use `hidden`), the `selected` attribute on
    tabs and panels (use `aria-selected`), and
    `create-tabbed-ui.mjs`/`createTabbedUI()`.
- **`stylable-select`, rebuilt** as a drop-in for a native listbox
  `<select>`:
  - The `HTMLSelectElement` contract: `value`/`selectedIndex` setters
    with native semantics (no match → nothing selected), `options`,
    `selectedOptions`, `length`, `item()`, `type`, and `multiple`.
  - Form-associated: submits `name`/value(s), works with `<label for>`,
    `form.reset()`, `required` (`:invalid`, `validity`,
    `setCustomValidity`), `disabled`, and `<fieldset disabled>`, and
    restores state.
  - The WAI-ARIA listbox pattern: `aria-activedescendant`,
    `aria-selected`, groups, arrows, `Home`/`End`, native-style
    typeahead, and Space to toggle in `multiple` mode.
  - `<option>` state is native, so `option:checked` and `option:disabled`
    work in CSS.
  - `input` + `change` fire on user changes only.
  - Fixed clicks in a scrolled list landing on the wrong option.
  - Removed: the `data-checked` attribute (use `option:checked` or
    `aria-selected`), the `change` event's `detail` (read `.value`), the
    reset-to-first-option on child changes, and clamping of out-of-range
    `selectedIndex` (now `-1`, like native).
- **`infinite-combo` is now `combo-box`**, rebuilt as an accessible,
  form-associated autocomplete (the WAI-ARIA combobox pattern, with list
  autocomplete):
  - Options come from three sources: its own `<option>`s (filtered as you
    type, with `<optgroup>` headings), a `src` URL template (JSON or HTML
    responses, no JavaScript needed), or a `searchFunction` property.
    Searches are debounced (`debounce`, `min-length`), and stale searches
    are aborted, so an old response can't replace a newer one.
  - Behaves like a form control: `name`, `value` (the attribute is the
    default, restored by `form.reset()`), `required`, `disabled`,
    `<fieldset disabled>`, `<label>`, and the validity API.
  - `allow-custom` makes it a free-text input. Without it, it's
    select-only.
  - `input`/`change` follow native timing, and the inner input's own
    events don't leak. `open` reflects, and a `toggle` `ToggleEvent`
    fires. Failures fire `error`. Result counts and loading are announced
    through a live region.
  - Removed: the `onsearch`/`onselect`/`loading` string-evaluated
    attributes (it's now CSP-safe), `select-tag`, and the dependency on
    domable.

- **No more customized built-ins** (`is="…"`), which Safari doesn't
  support:
  - **`hotkey-modal-dialog` is now `<hotkey-dialog>`**, a wrapper around a
    real `<dialog>`.
    - Shortcuts: several at once (`hotkey="mod+k /"`), `mod` for
      ⌘ on Apple platforms and Ctrl elsewhere, exact modifier matching
      (`ctrl+k` no longer fires on Ctrl+Alt+K), case-insensitive letters,
      and bare-key shortcuts that ignore typing in fields.
    - Light dismiss and Esc blocking use the native `closedby` attribute,
      polyfilled where unsupported, replacing `click-to-close` and
      `no-esc-close`. Light dismiss now checks the dialog's box, so a
      click on its padding no longer closes it.
    - New `show()`, `close()`, `toggle()`, and `non-modal`.
  - **`class-cycler-button` is removed, and `class-cycler` is rebuilt**
    around buttons:
    - Inside it, `<button>` cycles to the next value,
      `data-cycle="previous"` goes back, and `<button value>` sets a value
      (with `aria-pressed`). An `<output>` shows the value.
    - Invoker commands (`--next`, `--previous`, `--set`) work from
      anywhere.
    - `value` reflects, `target` selects every match (default `html`),
      `storage-key` is optional, and tabs stay in sync through `storage`
      events. `change` fires on user changes only.
    - Removed: the `global` attribute and its window function, and the
      `selector` attribute (use `target`).

- **`menu-component` is now `<drill-menu>`**, rebuilt in the light DOM:
  - Items are its children. An item with a `<template>` drills into that
    screen, and any other item (a link, a button) behaves as itself.
  - Back via `[data-back]`, Esc, `pop()`, or a `--back` invoker command,
    with focus moved into the screen and restored to the opening item.
  - One tab stop with arrow/Home/End roving focus.
  - A reflected `screen` attribute. `push`/`pop` events
    (`detail: { key, item }`) fire on every change, like `toggle`.
  - `sync-hash` adds history entries so the browser's Back button works,
    and `#key` links open screens. It replaces `hash.mjs`.
  - Removed: the shadow DOM and `::part`s, the `pushed` attribute (now
    `screen`), the `pushed`/`popped`/`reset` events (now `push`/`pop`),
    the `end` event and `data-end-event` (use `data-back`), and `hash.mjs`
    with `attach`/`detach` (use `sync-hash`).

- **`matchable`: no dependencies, and `attribute-provider` no longer
  overwrites anything**:
  - `query-container` parses its wrapper selectors itself
    (`matchable/simple-selector.mjs`), so the `parsel-js` dependency and
    its import map are gone. Quoted attribute values are now supported,
    and unsupported selectors throw a clear `SyntaxError`.
  - `attribute-provider` adds to each child's own classes, inline styles,
    and attributes, and restores exactly what it changed when a query
    stops matching. Previously it replaced the whole `class` and `style`
    attributes and never restored attributes. Children added later get
    the current state, and children that leave are restored.
    `!important` is honored in `styles`.
  - New demos, with no import maps. Removed the empty `index.css` files.

- **`definable` behaves like `<script src>`, and domkit has zero
  dependencies**:
  - `define-component` and `polyfill-window` resolve `src` against the
    document's base URL (respecting `<base href>`), and fire `load` and
    `error` (`ErrorEvent`) instead of failing with an unhandled rejection.
    Both have a `ready` promise. A missing export or a non-class export
    is reported. Removed: `force` (it could only warn), `no-import` (use
    `<script type="module">`), and `resolve-relative-url.mjs`.
  - `define-component-by-content` takes its markup from a `<template>`
    child (the `content` attribute still works). `mode` now accepts
    `open`, `closed`, or `none` (light DOM), replacing `use-dom`. It's
    reimplemented without domable and fires `load`/`error`.
  - Removed `shadow-dom` (a deprecated one-line alias for domable's
    `shadowOpen`) and `event-consumer` (native `on…` attributes cover
    standard events, and it was the last module that evaluated strings).
  - **No runtime dependencies remain** (`@johnhenry/domable` and
    `parsel-js` are gone), so no-build pages never need an import map,
    and every module is CSP-safe.

- **`internal-timer` is now `<frame-timer>`**, with a media-element-style
  API:
  - `play()`/`pause()`, a reflected `paused` attribute (also settable in
    markup), `play`/`pause` events, and a `ticks` count.
  - It no longer needs light-DOM content before it starts ticking.
  - Ticks are scheduled by elapsed time and corrected for drift, so any
    `fps` works on any refresh rate, and a backlog after the page was
    hidden is skipped, not burst.
  - Removed: the `pause` event you dispatched at it (use `pause()`, then
    `play()` later).
- **`frame-delay` paces by elapsed time**, so any positive `fps` works.
  It used to accept only divisors of 120 up to 60, and assumed a 60Hz
  display. A non-positive `fps` throws `RangeError`.

- **`code-color` rebuilt on the CSS Custom Highlight API**:
  - It never modifies the DOM. Tokens are ranges painted by
    `::highlight(domkit-<type>)`, so copy/paste, find-in-page, assistive
    technology, and editing work as on plain text.
  - Re-highlights on any text change, including `contenteditable`.
  - Takes the language from `language`, or a `<code class="language-…">`
    (Markdown/Prism output). Aliases like `javascript`, `ts`, `json`,
    `xml`, and `scss` work.
  - Themable with plain CSS, with `light-dark()` defaults in `index.css`.
  - A new dependency-free tokenizer (`code-color/tokenize.mjs`) covers
    JavaScript, CSS (including at-rule preludes and nesting), and HTML
    (including embedded `<style>`/`<script>`). It never throws.
  - Removed: the vendored 623-line W3Schools highlighter, its inline
    color styles, and the `mode` attribute (now `language`).

### Added (types and reference)

- **TypeScript declarations for every stable module.** Elements get theirs
  from `custom-elements.json`, and plain-function modules (`clamp`,
  `delay`, `frame-delay`, `live-query-selector`, `create-mutable-nodelist`,
  the cyclers, `hydratable`, `mounts`, `definetag`, `until-window-load`,
  `code-color/tokenize`) from their JSDoc via `tsc`. All are generated by
  `npm run manifest` and drift-checked in CI.
- **`docs/reference.md`**, generated from the manifest: every element's
  attributes, properties, methods, events, and CSS custom properties.

### Added (recipes and consistency)

- **`examples/`**: five recipes combining modules (theme switcher, command
  palette, settings panel, documentation page, game loop), each driven by
  a browser test.
- **`drill-menu` live screens**: a `data-screen="key"` child is shown and
  hidden in place, so form state persists across navigation and its
  fields submit with an enclosing form. Submitting with an invalid field
  in a hidden screen opens that screen, so the browser can show the
  message.
- **Cross-module consistency tests** (`consistency.spec.mjs`). Every
  element's tag matches its module, `hidden` hides every element with its
  stylesheet loaded, all creation paths and moves are error-free, and
  form-associated elements behave like native ones in a shared `<form>`
  and `<fieldset disabled>`.

### Fixed

- Every stylesheet's `display` rules are scoped to `:not([hidden])`.
  Before, `code-color`, `stylable-select`, `combo-box`, `drill-menu`, and
  `tabbed-ui` styles beat the browser's `[hidden]` rule, so for example a
  `<code-color>` in a hidden `tabbed-ui` panel stayed visible.

## [0.0.9] - 2026-09-30

A shape-and-documentation pass. The modules were reorganized only where the
directory structure itself was misleading. Every README was rewritten
against the code it documents, and a real test suite was added. Writing
accurate docs meant actually running each module, and that turned up more
bugs than any previous pass, most of them in modules the old docs
described as working.

### Breaking

- **The six demo-grade modules moved to `src/experimental/`**:
  `animate-paths`, `canvas-renderer`, `chernoff-face`, `imagedata-emitter`,
  `pixel-shader`, `xy-grapher`. Import them as
  `@johnhenry/domkit/experimental/<module>/…`. A README heading was the
  only signal before. Now the import path itself says "no stability
  promise", and `src/experimental/readme.md` spells out what that means.
- **Removed `graph-component`**: an empty `HTMLElement` subclass whose
  `demo.mjs` couldn't run (an infinite loop and nonexistent DOM APIs).
- **Removed `animate-paths/old.mjs`**: an earlier single-path variant,
  referenced only by a demo line that never actually used it.
- Behavior changes, all fixing documented-but-broken behavior:
  `stylable-select` now treats plain `<option>` children as options
  (always documented, previously ignored). `code-color` highlights its
  initial content (previously only later changes). `event-consumer` reads
  `bubbles` per event (previously only when `onevent` was set).
  `class-cycler` waits until both `global` and `storage-key` are set and
  it's connected (previously it threw "key is required" if `global` came
  first).

### Added

- **Bare module imports**: `@johnhenry/domkit/<module>` now resolves to
  that module's `index.mjs` (`exports` gained `"./*": "./src/*/index.mjs"`,
  with `./*.mjs` and `./*.css` keeping full-path imports working).
  `index.mjs` added to `experimental/chernoff-face` and
  `experimental/xy-grapher` so every module has one, except
  `hydratable/mounts`, whose files act at import time.
- **`global.mjs` for every stable element**: `query-container`,
  `attribute-provider`, `internal-timer`, `event-consumer`, and
  `menu-component` previously made you register them yourself.
- **`code-color`'s `mode` attribute** (`html`/`css`/`js`), passing through
  to the highlighter's existing modes.
- **A test suite**: `node:test` + happy-dom, 32 tests in `test/` covering
  every stable module, including a regression test for each bug below
  that happy-dom can express. (The two customized built-ins can't run
  under happy-dom; those tests are kept but skipped with the reason, and
  were verified in Chromium.)
- **`scripts/check-links.mjs`**: fails if any relative import, Markdown
  link, or documented `@johnhenry/domkit/…` path doesn't resolve through
  the real `exports` map. It immediately found stale references in five
  READMEs.
- **ESLint, one rule (`no-undef`)**: undeclared variables have shipped in
  this code more than any other bug (see `AGENTS.md`).
- `npm test` now runs all of the above. CI already runs `npm test`.
- READMEs for the four families (`definable/`, `matchable/`, `cyclable/`,
  `hydratable/`), for `experimental/`, and for all six experimental
  modules. Every module now has one.
- A working demo for the `imagedata-emitter → pixel-shader →
  canvas-renderer` pipeline, which never had one.

### Fixed

Found by running every module in a real browser while documenting it,
then pinned with tests:

- `infinite-combo`: **every search threw** (`Spread syntax requires
  ...iterable`). domable's `textToDom` returns a `DocumentFragment`, not
  the iterable `NodeList` that `lib`'s original returned. Broken since
  0.0.1. The `loading` attribute also threw a `ReferenceError`
  (`loadStr`), and its placeholder was never replaced by the results.
- `code-color`: never highlighted static content, and the vendored W3Schools
  highlighter threw `ReferenceError`s (`cc`, `result`: undeclared
  variables that only worked in the sloppy-mode original) on any JS
  containing `.`, or any CSS. `//` comments ran to the end of the block
  inside `<pre>` (they only ended at `<br>`).
- `menu-component/hash.mjs`: **threw on every push and pop**. It used
  `event.path`, which Chrome removed in v109. Now uses `composedPath()`.
  Separately, calling `attach()` after the menu had rendered made the
  first pop re-push the screen being closed.
- `create-mutable-nodelist`: `unshift()` on a non-empty list never
  returned. It copied forward through a real `Array`, growing `length`
  with every write, until `RangeError: Invalid array length`. The
  mutators now delegate to `Array.prototype`.
- `query-container`: when the default wrapper applied from the start, the
  children stayed *outside* it (visible in its own demo: `li li li ul()`).
  Selector values containing `]` (`ol[data-x=1].wide`) were split at the
  wrong bracket. The grammar's match is now non-greedy.
- `query-container` and `attribute-provider`: stopped responding to the
  viewport after being moved (disconnect cleared their media-query
  listeners, and reconnect never restored them). Both now use
  `addEventListener`, re-attach on connect, and release old listeners
  before re-parsing.
- `internal-timer`: reconnecting appended another `<slot>` and another
  `pause` listener, and moving it ran two tick loops at once. Each loop now
  retires when a newer one starts.
- `stylable-select`: plain `<option>` children were ignored, so the
  README's own example selected nothing. Its `demo.htm` never used
  `stylable-select` at all: it used an unregistered `<select-panel>`.
  Replaced with a real demo.
- `experimental/xy-grapher`: rendered nothing, ever. Its output sat behind
  a shadow root holding only a hidden `<slot>`, and its own container was
  then picked up as the point template. The previously documented cause
  (an undefined `genSVG()` that "throws") was wrong: that was dead code,
  never called, and has been removed. Now plots `[x, y]` pairs and
  `{ x, y, …attrs }` objects.
- `experimental/animate-paths`: its demo never registered
  `<animate-paths>`, so the gallery showed a static SVG. Its
  `observedAttributes` getter also assigned `window.onclick = ""`,
  clobbering any page-level click handler.
- `experimental/pixel-shader`'s `grid`: an operator-precedence slip
  (`y + (1 % h)` for `(y + 1) % h`) meant it drew only vertical lines.
- `experimental/chernoff-face`: an unused `clamp` import and a line of
  stray JS text inside the generated SVG.
- `experimental/canvas-renderer`: removed leftover `console.log`s.

### Documentation

- Root `README.md` reorganized around what a reader is trying to do
  ("Interface pieces", "Responding to screen size", "Remembering a user's
  choice", …) instead of extraction history. Each module now shows the
  tag its `global.mjs` registers, and the README gains sections on
  package layout, why there's no root import, using raw source with
  import maps, CSP, Safari and customized built-ins, stability, and
  development. The long provenance note became a short "History"
  paragraph pointing here.
- Every module README rewritten or corrected against its code. Among the
  fixes: wrong grammar in `query-container`'s example (`;` for `|`), stale
  CDN paths in both `class-cycler` READMEs, `infinite-combo` describing
  scroll-to-load-more (it doesn't) and function bodies (they're
  expressions), placeholder import paths (`"."`, `"?"`, `"mounts/…"`), a
  React example importing `createRoot` from `react`, and undocumented
  attributes, events, and parts across the widgets.
- `demo/index.html` regrouped to match the README, the
  `graph-component` card removed, and the three-module pixel pipeline
  added. All 26 frames load with every element defined.
- `AGENTS.md` rewritten for the new layout and loop, with new gotchas
  (domable's return shape, `Event.path`, Safari and customized built-ins,
  where happy-dom and hidden tabs differ from a visible browser).

## [0.0.8] - 2026-09-30

A second naming pass, reversing the direction of `0.0.7`: dropped the
`.component`/`.element` suffix convention entirely rather than applying it
more consistently, with one hard constraint — every resulting module name
keeps a hyphen (custom-element tag names are required to have one; the
module/directory names follow the same rule for consistency, even though
none of the actual registered tag strings were ever dotted or affected by
this pass either way).

**Renamed** (24 module directories; all cluster-internal imports,
`demo/index.html`, `demo/fragments/*`, and every affected `readme.md`
updated in the same change; verified with a full relative-import/HTML-src
resolution scan plus a headless-browser scan of all 27 gallery frames —
zero broken references, zero console/page errors):
- Plain suffix drop (hyphen already present): `animate-paths.component` →
  `animate-paths`, `chernoff-face.component` → `chernoff-face`,
  `code-color.component` → `code-color`, `event-consumer.component` →
  `event-consumer`, `imagedata-emitter.component` → `imagedata-emitter`,
  `infinite-combo.component` → `infinite-combo`, `internal-timer.component`
  → `internal-timer`, `shadow-dom.component` → `shadow-dom`,
  `stylable-select.component` → `stylable-select`, `tabbed-ui.component` →
  `tabbed-ui`, `xy-grapher.component` → `xy-grapher`,
  `definable/define-component.component` → `definable/define-component`,
  `definable/define-component-by-content.component` →
  `definable/define-component-by-content`,
  `definable/polyfill-window.component` → `definable/polyfill-window`,
  `matchable/query-container.component` → `matchable/query-container`,
  `matchable/attribute-provider.component` → `matchable/attribute-provider`,
  `cyclable/class-cycler.component` → `cyclable/class-cycler`.
- Compound rename (dotted qualifier collapsed to a hyphen):
  `cyclable/class-cycler.button.component` → `cyclable/class-cycler-button`,
  `hotkey-modal.dialog.component` → `hotkey-modal-dialog`.
- Hyphen-preserving exceptions — a bare suffix drop would have left these
  with no hyphen at all, which the custom-elements spec forbids for a real
  tag name and which this pass treats as a naming rule for module
  directories too: `canvasrenderer.component` → `canvas-renderer`,
  `pixelshader.component` → `pixel-shader` (natural word-break
  hyphenation); `graph.component` → `graph-component`, `menu.component` →
  `menu-component` (no natural word break, so `-component` was kept as a
  literal suffix word instead of a dot — `menu-component` also now
  exactly matches its own registered `menu-component` tag, for a
  different reason than the `0.0.7` rename that produced the same name).

None of this changes any registered `customElements.define(...)` tag
string — every tag in this package was already plain-hyphenated before
this pass (confirmed via a repo-wide scan), so this was purely an
import-path/module-directory change.

## [0.0.7] - 2026-09-30

A naming pass across individual modules (not the clusters — those were
settled in `0.0.4`/`0.0.5`), following the same `.component`-suffix and
kebab-case conventions already applied everywhere else, plus one removal
and one more real bug found while verifying the renames didn't break
anything.

**Removed:**
- `brains` — a 12-file input-abstraction experiment (AI vs. human input
  sources: random/gamepad/keyboard/swipe, behind a common interface), with
  no README, no demo, and nothing else in the package depending on it.
  Deleted outright rather than kept around unlabeled — domkit doesn't
  carry `lib`'s no-deletion contract, and this was genuinely never
  documented or used.

**Renamed** (all six confirmed to have zero external cross-references
before moving; internal cross-references and every demo/README fixed):
- `shadow-dom.element` → `shadow-dom.component` — every other custom
  element in the package uses `.component`; this was the one exception.
- `xy-grapher` → `xy-grapher.component`, `chernoff-face` → `chernoff-face.component`
  — both are real custom elements that had simply never gotten the suffix.
- `pauseframespersecond` → `frame-delay` — the one name in the codebase
  with zero word separators, and "pause frames per second" doesn't parse
  as an action. Also gained a readme (had none).
- `pause` → `delay` — "pause" implies suspending something already
  running; this is a standalone async sleep primitive. Also gained a
  readme (had none). `clamp` also gained a readme while touching this
  area (no rename needed — the name was already fine).
- `menu-component.component` → `menu.component` — the base name already
  said "component" before `.component` was appended a second time. The
  registered custom-element **tag name stays `menu-component`** — only
  the module/import path changed; `<menu>` is a real native HTML element
  and custom element names are required to contain a hyphen anyway, so
  the tag couldn't have become `<menu>` even if that were otherwise
  desirable.

**Found and fixed while verifying the renames** (unrelated to any of the
above — pure luck of re-testing everything thoroughly): `internal-timer.component`'s
tick loop is only ever started by a `slotchange` event on its internal
(hidden) `<slot>`, but `demo/fragments/internal-timer.html` gave it zero
light-DOM content — so its demo had *never*, since this package's original
extraction, actually ticked at all. No error was ever thrown; it just sat
at 0 forever. Fixed by giving the element real (if invisible) slotted
content in the demo, verified against a real browser with an actual
tick/pause/resume sequence, not just a syntax check.

## [0.0.6] - 2026-09-30

Extended every 0.0.5 demo to actually exercise what 0.0.5 added
(`.previous()`/`.peek()`/`.set()` in `cyclable`'s demo, `dehydrate()` in
`hydratable`'s, `unmount()` in `mounts`', the bracket-less-section fix in
`matchable`'s) -- and building the `mounts` demo surfaced a real,
previously-undetected bug in `mounts` itself, not just the demo:

- **`mounts/first.mjs`/`last.mjs` now skip whitespace-only text nodes and
  comments before checking whether `body.firstChild`/`lastChild` is a
  reusable element.** Without this, the "reuse an existing suitable
  element" path was effectively dead code in any normally-formatted HTML
  document: the newline + indentation right after `<body>` (or right
  before `</body>`) is a real text-node child, fails the `nodeType`
  check, and forces a new div to be created every time -- even when a
  perfectly good element sits right past the whitespace. New shared
  `mounts/skip-insignificant.mjs`, used by both. This is exactly the kind
  of bug that's invisible from reading the code (it only manifests
  against a real DOM with realistic whitespace) and invisible to
  `node --check`/import-resolution smoke tests -- it took actually
  running the demo in a real browser to catch.

## [0.0.5] - 2026-09-30

A completeness pass (duals/complements/supplements) across the four
namespaced clusters merged in `0.0.4`, read module by module. Real bugs
found and fixed, plus a handful of genuinely missing counterpart
operations added:

**`matchable`** (crash bugs -- the most severe findings):
- `query-container.component` and `attribute-provider.component` both
  claimed to share one pipe-delimited `[query] value` grammar, but only
  `attribute-provider.component` actually supported a bracket-less bare
  section (treated as "always applies"). `query-container.component` had
  no such fallback and threw a `TypeError` on one. Both now share one
  parser (`matchable/query-sections.mjs`), so the grammar is identical by
  construction instead of by convention.
- `attribute-provider.component`'s `setAttributes()` `reduce` callback
  returned `undefined` instead of the accumulator on a malformed/
  whitespace-only segment (e.g. `"foo:bar; ;baz:qux"`), corrupting the
  accumulator and crashing on the next `.push()`. Fixed to return `acc`.
- Both modules called `matchMedia(query)` twice per section (once for
  state, once for `.onchange`) instead of reusing one reference -- relied
  on every browser returning the same cached `MediaQueryList` for a given
  query string, which is true today but not a spec guarantee. The shared
  parser calls it once and passes the same object to both uses.

**`definable`:**
- `define-component.component`'s `force` attribute was documented to
  "re-register even if already defined," which is physically impossible --
  `customElements.define()` unconditionally throws if the name is taken,
  with no browser API to undo a registration. Using `force` on an
  already-registered name threw an uncaught exception. Now logs a
  `console.warn` explaining why and skips instead of throwing; the readme
  is corrected to describe what actually happens.
- `until-window-load` had no "already loaded" fast path -- if `load` had
  already fired before the listener attached (a late dynamic import, a
  slow deferred module script), the hidden content stayed hidden
  permanently. Now checks `document.readyState` first.
- `define-component.component` and `polyfill-window.component` had two
  copy-pasted copies of the same URL-directory-resolution logic; extracted
  to `definable/resolve-relative-url.mjs`.
- `define-component-by-content.component` parsed a `shadow` attribute and
  passed it through to domable's `constructSuperclass()`, which has no
  such parameter -- silently dropped, dead code. Removed (never part of
  the documented API; only `use-dom`/`mode` ever did anything).
- `definetag`'s dead commented-out try/catch variant removed.

**`cyclable`:**
- `localstorage-cycler/class.mjs` was an unused, never-imported
  near-duplicate of `localstorage-class-cycler/index.mjs`. Deleted.
- The engine only ever stepped forward, with no way to step back, read the
  current value without mutating it, or jump directly to a specific value.
  Added `.previous()`, `.peek()`, and `.set(value)`, attached to the same
  returned function `next()` already was -- fully backward compatible,
  nothing about the existing callable contract changed.
- `class-cycler.component`: renaming the `global` attribute directly from
  one non-empty value to another (`global="a"` → `global="b"`) leaked the
  old global -- only removal-to-empty was handled. Fixed to clear the old
  name on any change away from it, not just removal.

**`hydratable`:**
- `hydrate()` was a one-way transition with no way back -- worse, the
  `HYDRATED` flag was defined `configurable: false`, so it could never be
  cleared even manually. Added a `dehydrate()` counterpart (name
  configurable, defaults to `` `de${name}` ``), with its own
  `dehydrator()` registration mirroring `finalizer()`. Required changing
  `HYDRATED` to `configurable: true` -- the one real behavior change in
  this release, needed for `delete` to work at all. Also fixed a harmless
  but confusing `writible` (should be `writable`) typo in the same
  property descriptor while touching that line.
- `mounts`: no way to remove a mount point `first`/`last` created for you.
  Added `unmount(target)` (`mounts/unmount.mjs`) -- removes it only if
  `mounts` actually created it (tracked via a `WeakSet` in the new
  `mounts/created.mjs`); an existing element that was found and reused is
  left alone. Also added named `resolveFirst()`/`resolveLast()` exports
  alongside the existing eager default exports, for callers that want a
  fresh read instead of the one-shot import-time snapshot.

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
