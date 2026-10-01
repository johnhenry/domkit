# infinite-combo

A search-as-you-type combo box: a text `<input>` above an option list. On
every keystroke it calls your async `onsearch` code and replaces the list
with the HTML it returns, so the option set can be unbounded (a server
search, a large local index, and so on). Clearing the input restores the
options you wrote in the markup.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/infinite-combo/global.mjs"
></script>
<script>
  window.search = async ({ data }) => {
    const results = await fetch(`/api/search?q=${encodeURIComponent(data)}`)
      .then((r) => r.json());
    return results.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
  };
</script>

<infinite-combo
  onsearch="search(event)"
  onselect="console.log('picked', event.target.value)"
  loading="'<option disabled>Searching…</option>'"
  size="5"
>
  <option value="recent-1">A recent item</option>
</infinite-combo>
```

On connect, the element moves its children into a list element it creates
(a `<select>` by default) and puts an `<input>` in front of it.

## Attributes

`onsearch`, `onselect`, and `loading` take a JavaScript **expression**,
not a function body. The element evaluates `return <your expression>`
with a single parameter named `event`.

| Attribute | `event` is | Should evaluate to |
|---|---|---|
| `onsearch` | `{ data, initial, initialString }`: the trimmed input text, the original option elements, and their HTML | An HTML string, or a promise of one, that replaces the list |
| `loading` | same as `onsearch` | An HTML string, **synchronously**, shown while `onsearch` is pending |
| `onselect` | `{ target }`: the selected option element | Anything. It's awaited, then a `select` event fires |
| `size` | | Forwarded to the list, like `<select size>` |
| `select-tag` | | Tag name of the list element. Defaults to `select`. `stylable-select` works too (see [stylable-select](../stylable-select/readme.md)) |

`onsearch` and `onselect` can be changed after connect. `loading` and
`select-tag` are read once, on connect.

## Set by the element

| Attribute | Meaning |
|---|---|
| `loading` | Present (empty) while a search is in flight. This **overwrites** the `loading` attribute you wrote, which is safe because that one was already read on connect, but don't rely on reading it back |
| `selected` | Present after an option is chosen, removed when the selection moves again |

## API

| Member | Description |
|---|---|
| `value` | Get: the selected option's value. Set: select by value, by visible text, or by numeric index. Throws if there's no match |
| `index` | The selected option's index |
| `selected` | `{ element, index, value }` for the current selection |
| `search` | Get/set the input's text (setting it does not trigger a search) |

## Events

| Event | When |
|---|---|
| `change` | The selection moves (arrow keys, click). Also fires when the mouse moves over an option, even though hovering doesn't change the selection |
| `select` | An option is chosen: <kbd>Enter</kbd> anywhere in the element, a click on an option, or <kbd>Space</kbd> in the list |

## Keyboard

In the input, <kbd>↑</kbd>/<kbd>↓</kbd> move the selection through the
list (wrapping at either end), and <kbd>Enter</kbd> chooses it.

## Notes

- Searches aren't debounced or cancelled. A slow response to an earlier
  keystroke can arrive after a faster later one and replace it. Debounce
  inside your `onsearch` if that matters.
- The attribute expressions are evaluated with `new Function`, so a page
  with a strict Content-Security-Policy (no `unsafe-eval`) can't use them.
- When loading this module from raw source in a browser (not via a CDN
  or bundler), it imports `@johnhenry/domable/text-to-dom` by bare
  specifier and needs an import map. `demo.htm` shows the pattern.
