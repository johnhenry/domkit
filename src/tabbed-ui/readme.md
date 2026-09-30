# Tabbed UI

A tabs/panels custom element. One child (marked `slot="tab-bar"`, or the
first child by default) holds the clickable tabs; each of its own children
corresponds, by position, to one of the element's remaining children as
that tab's panel — clicking a tab shows its panel (`selected` attribute +
`display`) and hides the rest.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/tabbed-ui/global.mjs"
></script>
<tabbed-ui>
  <div slot="tab-bar">
    <button>One</button>
    <button>Two</button>
  </div>
  <div>Panel one</div>
  <div>Panel two</div>
</tabbed-ui>
```
