# stylable-select

A listbox you can style completely, that otherwise behaves exactly like a
native `<select size="…">` or `<select multiple>`. It has the same
properties (`value`, `selectedIndex`, `options`, `selectedOptions`, …),
submits with its form, supports `required`, `disabled`, `<label>`, and
`form.reset()`, and fires `input` and `change` the same way. Its options are
real `<option>` elements, so `option:checked` and `option:disabled` work in
your CSS.

> **Do you need it?** Chromium now lets you style a native drop-down
> `<select>` with `appearance: base-select`, and that's the better choice
> when it's available. `stylable-select` is for an always-visible list,
> for multi-select, for option content no native `<option>` allows, or
> for browsers without `base-select`.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/stylable-select/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/stylable-select/index.css" />

<form>
  <label for="fruit">Fruit</label>
  <stylable-select id="fruit" name="fruit" required>
    <optgroup label="Common">
      <option value="apple">Apple</option>
      <option value="banana" selected>Banana</option>
    </optgroup>
    <optgroup label="Rare" disabled>
      <option value="durian">Durian</option>
    </optgroup>
    <div role="option" data-value="cherry"><img src="cherry.svg" alt="" /> Cherry</div>
  </stylable-select>
</form>
```

**Options** are `<option>` elements, or any element with `role="option"`
(for rich content an `<option>` can't hold). They can be nested at any
depth, typically in `<optgroup>`s. An option's value is its `value`
(an `<option>` falls back to its text), or `data-value`/text for a
`role="option"` element. Mark default selections with `selected` on an
`<option>`, or `aria-selected="true"` on a `role="option"` element.

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `name` | `name` | Name submitted with the form |
| `multiple` | `multiple` | Allow more than one selected option. Each is submitted as its own entry |
| `disabled` | `disabled` | No interaction, not focusable, not submitted. Also inherited from a disabled `<fieldset>` |
| `required` | `required` | The form is invalid until something is selected |
| `size` | `size` | Visible rows (used by `index.css` via `--domkit-select-size`) |

## Properties and methods

The same as `HTMLSelectElement`: `value` (get/set), `selectedIndex`
(get/set; `-1` = nothing), `options`, `selectedOptions`, `selectedOption`
(the first selected option, as on `infinite-combo-box`), `length`,
`item(i)`, `type` (`"select-one"`/`"select-multiple"`), `form`, `labels`,
`validity`, `validationMessage`, `willValidate`, `checkValidity()`,
`reportValidity()`, `setCustomValidity()`.

As with a native select, setting `value` to a value no option has
selects nothing, and script changes never fire events.

## Events

| Event | When |
|---|---|
| `input`, then `change` | The user changed the selection by click or keyboard. Both bubble, like a native select's |

## Keyboard

Follows the [WAI-ARIA listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).
The element is a single tab stop, and the active option is announced via
`aria-activedescendant`.

| Key | Single | `multiple` |
|---|---|---|
| <kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Home</kbd>/<kbd>End</kbd> | Select the previous/next/first/last option | Move the active option |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | | Toggle the active option |
| Typing | Select the next option starting with what you typed, like a native select | Move to it |

Disabled options and options in a disabled `<optgroup>` are skipped.

## Styling

Ordinary CSS on ordinary elements:

| Selector | Matches |
|---|---|
| `option:checked`, `[role="option"][aria-selected="true"]` | Selected options |
| `option:disabled`, `[aria-disabled="true"]` | Disabled options |
| `[data-active]` | The keyboard-active option |
| `stylable-select:invalid`, `:disabled` | Form states, as on native controls |

`index.css` is an optional starting point using `currentColor`, plus
domkit's shared tokens (`--domkit-highlight` for the selected background,
`--domkit-focus-ring`, …; see [`theme.css`](../theme.css)), plus its own
`--domkit-select-size`.

## Notes

- Options added or removed later are picked up, and a removed selection
  is dropped from the value.
- Its sibling [infinite-combo-box](../infinite-combo-box/readme.md) uses the same option
  markup, value rules, styling hooks, and events, for when the list should
  be searchable.
