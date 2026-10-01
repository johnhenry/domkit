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

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `selected-index` | `selectedIndex` | Index of the selected tab. Set it to choose the initial tab, or to switch from script. It always reflects the current selection |
| `manual` | `manual` | Manual activation: arrow keys move focus, and <kbd>Enter</kbd>/<kbd>Space</kbd> selects. By default, moving focus selects |

Read-only properties: `tabList`, `tabs`, `panels`.

On the markup:

| On | Attribute | Effect |
|---|---|---|
| a tab | `aria-selected="true"` | Initial selection, if `selected-index` isn't set |
| a tab | `disabled` or `aria-disabled="true"` | Can't be selected, and is skipped by the arrow keys |
| the tab list | `aria-orientation="vertical"` | <kbd>↑</kbd>/<kbd>↓</kbd> instead of <kbd>←</kbd>/<kbd>→</kbd> (index.css stacks it too) |
| anything | `role`, `id`, `tabindex` you write | Kept. The element only fills in what's missing |

## Events

| Event | When |
|---|---|
| `change` | The user selected a different tab. Read `event.target.selectedIndex`. Like a native `change`, it bubbles and isn't fired for script changes |

## Keyboard

| Key | Action |
|---|---|
| <kbd>←</kbd> / <kbd>→</kbd> | Previous/next tab, wrapping, skipping disabled tabs |
| <kbd>Home</kbd> / <kbd>End</kbd> | First/last tab |
| <kbd>Tab</kbd> | Leaves the tab list for the selected panel |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Select the focused tab (needed with `manual`, or for non-button tabs) |

## Styling

Style it with ordinary CSS: `[role="tab"][aria-selected="true"]` is the
selected tab, and `[role="tabpanel"]` (with `[hidden]`) the panels.
`index.css` also reads these custom properties:

| Property | Default | |
|---|---|---|
| `--domkit-tab-accent` | `currentColor` | Selected-tab underline and focus ring |
| `--domkit-tab-border` | 25% `currentColor` | Line under the tab list |
| `--domkit-tab-gap` | `0.25rem` | Space between tabs |
| `--domkit-tab-padding` | `0.5em 1em` | Padding inside each tab |

## Notes

- Tabs and panels added or removed later are wired up automatically, and
  the selection is kept (clamped if its tab disappears).
- Nested `<tabbed-ui>` elements are independent.
- Use `<button>`s as tabs: they're focusable and activate on click,
  <kbd>Enter</kbd>, and <kbd>Space</kbd> natively. Other elements work, but
  get focusability only from the roving `tabindex`.
