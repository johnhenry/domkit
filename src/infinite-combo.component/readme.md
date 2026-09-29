# Infinite Combo

A combo-box/autocomplete element that loads more options on demand — as
the user types or scrolls near the end of the list, `onsearch` is called
to fetch and append more `<option>` markup, for effectively unbounded
option lists.

## Attributes

| Attribute | Description |
|---|---|
| `onsearch` | Async function body (as a string, like `onclick`) returning HTML option markup to append. Receives an event with the current input text |
| `onselect` | Function body run when an option is selected |
| `size` | Number of visible options, like native `<select size>` |
| `select-tag` | Tag name used for the internal options list. Defaults to `select` |
| `loading` | Function body run while a search is in flight |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/infinite-combo.component/global.mjs"
></script>
<script>
  window.search = async (event) =>
    `<option>${event.data}</option>`;
</script>
<infinite-combo onsearch="window.search(event)" size="5"></infinite-combo>
```

See `demo.htm` for a fuller working example.
