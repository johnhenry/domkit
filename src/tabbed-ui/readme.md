# tabbed-ui

Tabs and panels from plain HTML. Write a list of buttons and a panel for
each, and `<tabbed-ui>` wires up the
[WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
roles, ids, `aria-selected`/`aria-controls`, roving focus, and full keyboard
support. Panels are shown and hidden with the `hidden` attribute.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/tabbed-ui/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/tabbed-ui/index.css" />

<tabbed-ui>
  <div>
    <button>Overview</button>
    <button>Specs</button>
    <button>Reviews</button>
  </div>
  <section>Overview panel</section>
  <section>Specs panel</section>
  <section>Reviews panel</section>
</tabbed-ui>
```

The **tab list** is the child with `role="tablist"`, or, without one, the
first child. Each of its children is a tab, and the remaining children are
the panels, matched to tabs **by position**. Until the element upgrades
(or if JavaScript is off), every panel is visible, so the content is
always readable.

`index.css` is optional. It adds an underline for the selected tab, a
focus ring, and four custom properties (below). Without it the element
adds no styling at all.

## Markup

Attributes you can write on the parts:


| On | Attribute | Effect |
|---|---|---|
| a tab | `aria-selected="true"` | Initial selection, if `selected-index` isn't set |
| a tab | `disabled` or `aria-disabled="true"` | Can't be selected, and is skipped by the arrow keys |
| the tab list | `aria-orientation="vertical"` | <kbd>↑</kbd>/<kbd>↓</kbd> instead of <kbd>←</kbd>/<kbd>→</kbd> (index.css stacks it too) |
| anything | `role`, `id`, `tabindex` you write | Kept. The element only fills in what's missing |

## Driving it from elsewhere

`next()` and `previous()` select the next or previous enabled tab
(wrapping), without an event. Buttons anywhere on the page can do the
same with [invoker commands](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API),
with no script, for "Next step" buttons in a wizard. These count as the
user's choice, so `change` fires:

```html
<tabbed-ui id="steps">…</tabbed-ui>
<button commandfor="steps" command="--previous">Back</button>
<button commandfor="steps" command="--next">Next</button>
<button commandfor="steps" command="--select" value="0">Start over</button>
```

`--select` takes the tab's index from the button's `value`. Disabled
tabs are skipped, and a disabled `<tabbed-ui>` ignores commands.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `selected-index` | `selectedIndex` | `number` | Index of the selected tab. Reflects the current selection. |
| `manual` | `manual` | `boolean` | Arrow keys move focus only; Enter/Space selects (manual activation). |
| `disabled` | `disabled` | `boolean` | No tab can be selected by the user (or by commands), and the tabs leave the tab order. Panels stay as they are. |

### Properties

| Property | Type | Description |
|---|---|---|
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `tabList` (read-only) | `Element \| null` | The tab list: the child with role="tablist", else the first element child. |
| `tabs` (read-only) | `Element[]` | The tabs, in order. |
| `panels` (read-only) | `Element[]` | The panels, in order (every element child except the tab list). |
| `selectedIndex` | `number` | Index of the selected tab. Setting it does not fire `change`. |
| `manual` | `boolean` | With `manual`, arrow keys move focus and Enter/Space selects. |

### Methods

| Method | Description |
|---|---|
| `next()` | Select the next enabled tab (wrapping), without an event. |
| `previous()` | Select the previous enabled tab (wrapping), without an event. |

### Events

| Event | Description |
|---|---|
| `change` | The user selected a different tab (click, keyboard, or an invoker command). Not fired for script changes. |

### CSS custom properties

| Property | Description |
|---|---|
| `--domkit-tab-gap` | Space between tabs (index.css). |
| `--domkit-tab-padding` | Padding inside each tab (index.css). |
| `--domkit-accent` | Selected-tab indicator (shared token; see theme.css). |
| `--domkit-border` | Line under the tab list (shared token). |
| `--domkit-focus-ring` | Focus outline of tabs and panels (shared token). |

<!-- api:end -->

## Keyboard

| Key | Action |
|---|---|
| <kbd>←</kbd> / <kbd>→</kbd> | Previous/next tab, wrapping, skipping disabled tabs. Swapped in right-to-left text |
| <kbd>Home</kbd> / <kbd>End</kbd> | First/last tab |
| <kbd>Tab</kbd> | Leaves the tab list for the selected panel |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Select the focused tab (needed with `manual`, or for non-button tabs) |

## Styling

Style it with ordinary CSS: `[role="tab"][aria-selected="true"]` is the
selected tab, and `[role="tabpanel"]` (with `[hidden]`) the panels.
`index.css` takes its colors and focus ring from domkit's shared tokens
(`--domkit-accent`, `--domkit-border`, `--domkit-focus-ring`, …; see
[`theme.css`](../theme.css)), with `currentColor` fallbacks. Its own
knobs are `--domkit-tab-gap` (default `0.25rem`) and
`--domkit-tab-padding` (default `0.5em 1em`).

## Notes

- Tabs and panels added or removed later are wired up automatically, and
  the selection is kept (clamped if its tab disappears).
- Nested `<tabbed-ui>` elements are independent.
- Use `<button>`s as tabs: they're focusable and activate on click,
  <kbd>Enter</kbd>, and <kbd>Space</kbd> natively. Other elements work, but
  get focusability only from the roving `tabindex`.
