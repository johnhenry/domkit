# Stylable Select

A `<select>`-like custom element (`<option>`/`<optgroup>` children,
`value`/`selectedIndex` properties, `change` events, arrow-key/click
navigation) whose individual options can actually be styled with CSS —
unlike the native `<select>`, whose options can't be styled consistently
across browsers.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/stylable-select/global.mjs"
></script>
<link
  rel="stylesheet"
  href="https://esm.sh/@johnhenry/domkit/stylable-select/index.css"
/>
<stylable-select>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</stylable-select>
```

See `demo.htm` for a fully-styled example with `<optgroup>`.
