# stylable-select

A listbox that behaves like `<select size="…">` but whose options are
ordinary elements, so every one of them can be styled, including
`::before`/`::after`, flex layout, and hover states. A native `<select>`
can't offer that consistently across browsers.

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

<stylable-select tabindex="0" id="fruit">
  <optgroup label="Fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
  </optgroup>
  <div role="option" data-value="okra">Okra</div>
</stylable-select>

<script type="module">
  document.getElementById("fruit").addEventListener("change", (event) => {
    console.log(event.detail); // "apple", "banana", or "okra"
  });
</script>
```

`index.css` is optional. It sets up a scrollable one-column grid and a
default highlight for the selected option.

## Options

An **option** is any descendant that is an `<option>` or has
`role="option"`, at any depth (so `<optgroup>` or any other wrapper works
for grouping). Its value is the first of these that is set:

1. its `value` attribute
2. its `data-value` attribute
3. its text content

## API

| Member | Description |
|---|---|
| `selectedIndex` | Get/set the selected option's index. Out-of-range values clamp to the first/last option. Starts as `""`, meaning nothing selected |
| `value` | The selected option's value (read-only) |
| `options` | A `NodeList`-like array of the current option elements |

## Events

| Event | `detail` | When |
|---|---|---|
| `change` | the new value | An option is selected by click, arrow key, or setting `selectedIndex` |

## Styling hooks

The selected option gets a `data-checked` attribute:

```css
stylable-select option[data-checked] {
  background: rebeccapurple;
  color: white;
}
```

## Keyboard

<kbd>↑</kbd>/<kbd>↓</kbd> move the selection while the element has focus.
Give it a `tabindex` so it can receive focus at all. Arrow keys call
`preventDefault()`, so they don't scroll the page. Note that *every*
`keydown` inside the element has its propagation stopped.

## Notes

- Adding or removing direct children resets the selection to the first option.
- `<optgroup>` isn't selectable, and in Chromium it renders its own
  `label` attribute. There's no need to add it again with CSS.
- [infinite-combo](../infinite-combo/readme.md) can use this element as
  its option list (`select-tag="stylable-select"`).
