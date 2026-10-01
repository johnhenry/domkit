# tabbed-ui

A tabs/panels element with no shadow DOM and no required markup beyond
plain children. One child is the tab bar; each of *its* children is a
tab, and matches by position to one of the element's remaining children,
its panel. Clicking anywhere inside a tab shows that tab's panel and hides
the rest.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/tabbed-ui/global.mjs"
></script>

<tabbed-ui data-default-index="1">
  <div slot="tab-bar">
    <button>One</button>
    <button>Two</button>
  </div>
  <div>Panel one</div>
  <div>Panel two (shown first, because of data-default-index)</div>
</tabbed-ui>
```

With a bundler: `import "@johnhenry/domkit/tabbed-ui/global.mjs"` registers
`<tabbed-ui>`, or import the class and register it under any name you
like:

```js
import TabbedUI from "@johnhenry/domkit/tabbed-ui";
customElements.define("my-tabs", TabbedUI);
```

To make an existing element tabbed without a custom element at all, use the
function the element is built on:

```js
import { createTabbedUI } from "@johnhenry/domkit/tabbed-ui/create-tabbed-ui.mjs";
createTabbedUI(document.querySelector("#settings"));
```

## Markup and attributes

| On | Attribute | Meaning |
|---|---|---|
| a child | `slot="tab-bar"` | Marks that child as the tab bar. Without one, the **first** element child is the tab bar |
| `<tabbed-ui>` | `data-default-index` | Index of the tab selected on connect. Defaults to `0` |
| `<tabbed-ui>` or a panel | `data-display` | The `display` value a panel gets when shown. A panel's own value wins over the element's. Defaults to `block` |

Set by the element (style against these):

| On | Attribute | Meaning |
|---|---|---|
| the selected tab and its panel | `selected` | Present on exactly one tab/panel pair |
| every hidden panel | `style="display: none"` | Inline, so a hidden panel stays hidden whatever your stylesheet says |

## Notes

- Tabs and panels are matched **by position**, not by id. Add or remove
  them in pairs.
- There is no keyboard handling and no ARIA wiring (`role="tablist"` etc.).
  Use real `<button>`s as tabs so they are at least focusable and
  clickable from the keyboard.
