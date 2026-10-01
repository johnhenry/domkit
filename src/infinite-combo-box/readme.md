# infinite-combo-box

An autocomplete input: type, and a list of matching options pops up to
choose from. Results can be **paged**: the list loads more as you scroll
or arrow to its end, so result sets can be any size. It follows the
[WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
and works in forms like a native control (`name`, `required`, `disabled`,
`<label>`, `form.reset()`). Options can come from three places, and none
of them requires writing JavaScript.

## Usage

**Filter options you write.** The simplest case, like `<input list>` with
a `<datalist>` you can style:

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/infinite-combo-box/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/infinite-combo-box/index.css" />

<label for="city">City</label>
<infinite-combo-box id="city" name="city" placeholder="Start typing…">
  <option value="nyc">New York</option>
  <option value="sf">San Francisco</option>
  <option value="sea">Seattle</option>
</infinite-combo-box>
```

**Search a URL as the user types.** `{query}` is replaced with the
encoded text. The response can be JSON (an array of strings or
`{ value, label }`) or HTML (`<option>` markup):

```html
<infinite-combo-box name="user" src="/api/users?search={query}" min-length="2"></infinite-combo-box>
```

**Use any async function**, set as a property:

```js
document.querySelector("infinite-combo-box").searchFunction = async (query, { signal }) => {
  const response = await fetch(`/search?q=${encodeURIComponent(query)}`, { signal });
  return response.json(); // or an HTML string, or option elements
};
```

Searches are debounced, and starting a new one aborts the previous one
(`signal` fires), so a slow response can never replace a newer one. With
`src` or `searchFunction`, the options written in the markup are shown as
suggestions while the input is empty.

## Paging ("infinite" results)

When a source has more results than fit in one response, return them a
page at a time. The list loads the next page when its end scrolls into
view, when the keyboard reaches the end, or when "Load more results" (the
last option while more exist) is chosen.

**From a URL**, put `{cursor}` in `src` and reply with JSON carrying the
next cursor. It's `""` for the first page, and `null` or omitted when
there are no more. `total` is optional:

```html
<infinite-combo-box name="user" src="/api/users?q={query}&cursor={cursor}"></infinite-combo-box>
```

```json
{ "options": [{ "value": "u41", "label": "Ada" }], "next": "eyJvZmZzZXQiOjIwfQ", "total": 95 }
```

An HTML response can carry the cursor (and total) on any element marked
`data-next`/`data-total`, which is removed before rendering:

```html
<option value="u41">Ada</option> … <span data-next="eyJvZmZzZXQiOjIwfQ" data-total="95"></span>
```

**From a function**, it receives the cursor and returns the same shape:

```js
combo.searchFunction = async (query, { cursor, signal }) => {
  const { items, nextCursor } = await api.users(query, cursor, { signal });
  return { options: items, next: nextCursor };
};
```

**From your own options**, `page-size="50"` shows matches 50 at a time,
which helps with lists of thousands of `<option>`s.

Cursors are opaque, so page numbers, offsets, or API tokens all work.
Typing a new query aborts any page still loading, so a page for an old
query can never appear. While pages load, the list has `aria-busy`, and
the live region announces "20 more results loaded, 40 of 95". Options get
`aria-setsize`/`aria-posinset` (setsize `-1` when the total is unknown).
`hasMore` and `loadMore()` expose the same thing to scripts.

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `name` | `name` | Name submitted with the form |
| `value` | `value` | The value: the chosen option's `value`. The attribute is the default (restored by `form.reset()`), and the property is current. Setting it matches by value, then by label |
| `placeholder` | | Passed to the input |
| `src` | `src` | URL template for remote options: `{query}` and `{cursor}` are replaced. Missing ones are appended as `?q=`/`?cursor=` |
| `page-size` | | Show the element's own matching options this many at a time (see Paging) |
| `debounce` | | Milliseconds to wait after typing. Default `0` for local options, `200` for `src`/`searchFunction` |
| `min-length` | | Characters needed before searching. Default `0` |
| `allow-custom` | `allowCustom` | Free text: whatever is typed is the value, even if no option matches. Without it, only choosing an option sets the value |
| `open` | `open` | Whether the list is showing. Reflects, and can be set |
| `disabled` | `disabled` | Disables the input and stops submission. Also inherited from a disabled `<fieldset>` |
| `required` | `required` | The form is invalid until there's a value |

Other properties: `text` (the input's text), `options` (the options now
in the list, not counting "Load more results"), and the same option API as
`stylable-select`: `selectedOption`, `selectedOptions`, `selectedIndex`
(get/set), `length`, and `item(i)`. Also `hasMore`, `loadMore()`, `selectedOption`, `input` (the inner `<input>`),
`searchFunction`, `form`, `labels`, `validity`, `validationMessage`,
`willValidate`, `checkValidity()`, `reportValidity()`,
`setCustomValidity()`, and `focus()`.

## Events

| Event | When |
|---|---|
| `input` | The value changed: an option was chosen, the text was cleared, or (with `allow-custom`) the user typed |
| `change` | The value was committed: an option was chosen, or focus left / Enter was pressed after typing a new value |
| `toggle` | The list opened or closed. A `ToggleEvent` with `oldState`/`newState`, like a popover's |
| `error` | `src` or `searchFunction` failed. An `ErrorEvent`, and the list announces "Couldn't load results." |

Script changes (setting `value`) fire nothing. The inner `<input>`'s own
`input`/`change` events don't escape the element, so listeners only ever
see the element's events. Native `oninput`/`onchange` attributes work.

## Keyboard

| Key | Action |
|---|---|
| typing | Filter or search, and open the list |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Open the list, or move through options (wrapping, skipping disabled ones) |
| <kbd>Enter</kbd> | Choose the active option. With the list closed, it submits the form like any input |
| <kbd>Esc</kbd> | Close the list, or, if it's closed, clear the text |
| <kbd>Alt</kbd>+<kbd>↑</kbd> | Close the list |

Focus stays in the input throughout. The active option is announced
through `aria-activedescendant`, and result counts ("3 results
available.") through a polite live region.

## Markup and styling

- Write your own `<input>` as the first child to control its attributes
  (`type="search"`, `autocapitalize`, classes). Otherwise one is created.
  Don't give it a `name`: the element submits the value.
- Option markup and value rules are the same as
  [stylable-select](../stylable-select/readme.md)'s: `<option>`s or
  `role="option"` elements, value from `value`/`data-value`/text, and
  `disabled`. Local `<optgroup>`s become group headings
  (`[data-group-label]`).
- Hooks: `[data-load-more]` (the "Load more results" option),
  `[role="listbox"]` (the list, `hidden` when closed,
  `aria-busy="true"` while loading, plus `infinite-combo-box:state(loading)`),
  `[data-active]` (the keyboard-active option), and
  `[aria-selected="true"]` (the chosen option). `index.css` positions the
  list under the input, using `Canvas`/`CanvasText` colors and
  domkit's shared tokens (`--domkit-highlight`, `--domkit-surface`, …;
  see [`theme.css`](../theme.css)).
