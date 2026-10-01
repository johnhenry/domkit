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

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `placeholder` |  | `string` | Placeholder for the input. |
| `disabled` | `disabled` | `boolean` | Blocks interaction and form submission. Also inherited from a disabled fieldset. |
| `required` | `required` | `boolean` | The form is invalid until there's a value. |
| `open` | `open` | `boolean` | Whether the option list is showing. Reflects. |
| `value` | `value` | `string` | Initial value (the value of an option, or text with `allow-custom`). |
| `src` | `src` | `string` | URL template for remote options: `{query}` and `{cursor}` are replaced (missing ones are added as `?q=`/`?cursor=`). JSON (an array, or `{ options, next, total }`) or HTML (with an optional `data-next` element). |
| `name` | `name` | `string` | Name submitted with the form. |
| `debounce` |  | `number` | Milliseconds to wait after typing before searching. Default 0 for local options, 200 for `src`/`searchFunction`. |
| `page-size` |  | `number` | Show the element's own matching options this many at a time, loading more as the list scrolls. |
| `min-length` |  | `number` | Characters needed before searching. Default 0. |
| `allow-custom` | `allowCustom` | `boolean` | Typed text is a valid value even if it matches no option. |

### Properties

| Property | Type | Description |
|---|---|---|
| `value` | `string` | The current value: the chosen option's value, or the typed text with `allow-custom`. Setting it chooses the matching option (by value, then by label). Script changes don't fire events. |
| `text` | `string` | The text in the input. |
| `options` (read-only) | `Element[]` | The options currently in the list. |
| `hasMore` (read-only) | `boolean` | Whether the source has more results for the current query. |
| `selectedOption` (read-only) | `Element \| null` | The chosen option element, if it's in the list. |
| `selectedOptions` (read-only) | `Element[]` | The chosen option as a list (0 or 1 items), like a select's. |
| `selectedIndex` | `number` | Index of the chosen option among the options now in the list, or -1. Setting it chooses that option (-1 clears the value). Script changes don't fire events. |
| `length` (read-only) | `number` | Number of options now in the list. |
| `input` (read-only) | `HTMLInputElement \| null` | The inner `<input>` (generated, or the one you wrote as a child). |
| `searchFunction` | `((query: string, init: { signal: AbortSignal, cursor: string }) => unknown) \| null` | A function that produces options for a query, instead of filtering the child `<option>`s or fetching `src`: `async (query, { signal }) =>` an HTML string, an array of strings / `{ value, label }` / Nodes, or a Node. `signal` aborts when a newer search starts. To page results, return `{ options, next, total? }`: `next` is the cursor passed back as `cursor` for the following page (null when there are no more). |
| `open` | `boolean` | Mirrors the `open` attribute. |
| `name` | `string` | Mirrors the `name` attribute. |
| `src` | `string` | Mirrors the `src` attribute. |
| `allowCustom` | `boolean` | Mirrors the `allow-custom` attribute. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `required` | `boolean` | Mirrors the `required` attribute. |
| `form` (read-only) | `HTMLFormElement \| null` |  |
| `labels` (read-only) | `NodeList` |  |
| `validity` (read-only) | `ValidityState` |  |
| `validationMessage` (read-only) | `string` |  |
| `willValidate` (read-only) | `boolean` |  |

### Methods

| Method | Description |
|---|---|
| `loadMore()` | Load the next page of results for the current query (what scrolling to the end of the list does). Resolves when it's appended. |
| `item(index)` | The option at `index` in the list. |
| `checkValidity()` |  |
| `reportValidity()` |  |
| `setCustomValidity(message)` |  |
| `focus(options)` | Focus the input. |

### Events

| Event | Description |
|---|---|
| `error` |  |
| `input` | The user changed the value (chose an option, or typed with `allow-custom`). |
| `change` | The user committed a new value (chose an option, or left the field after typing with `allow-custom`). |
| `toggle` | The list opened or closed (a ToggleEvent with `oldState`/`newState`, like a popover). |

### CSS custom properties

| Property | Description |
|---|---|
| `--domkit-highlight` | Background of the active option (shared token; see theme.css). |
| `--domkit-surface` | Background of the popup list (shared token). |

<!-- api:end -->

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

## Notes

- Script changes (setting `value`) fire nothing. The inner `<input>`'s own `input`/`change` events don't escape the element, so listeners only ever see the element's events. Native `oninput`/`onchange` attributes work.
