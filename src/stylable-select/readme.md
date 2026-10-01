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

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `disabled` | `disabled` | `boolean` | Blocks interaction and form submission. Also inherited from a disabled fieldset. |
| `required` | `required` | `boolean` | The form is invalid until an option is selected. |
| `multiple` | `multiple` | `boolean` | Allow selecting more than one option. |
| `size` | `size` | `number` | Number of visible rows (sets `--domkit-select-size`, used by index.css). |
| `name` | `name` | `string` | Name submitted with the form. |

### Properties

| Property | Type | Description |
|---|---|---|
| `options` (read-only) | `Element[]` | Every option, in document order (including those in groups). |
| `selectedOptions` (read-only) | `Element[]` | The selected options. |
| `selectedOption` (read-only) | `Element \| null` | The first selected option, or null (like infinite-combo-box's). |
| `selectedIndex` | `number` | Index of the first selected option, or -1. Setting it selects only that option. Script changes don't fire events. |
| `value` | `string` | Value of the first selected option, or "". Setting it selects the first option with that value (or nothing, if none matches). |
| `length` (read-only) | `number` | Number of options. |
| `type` (read-only) | `string` | "select-one" or "select-multiple", like a native select. |
| `name` | `string` | Mirrors the `name` attribute. |
| `multiple` | `boolean` | Mirrors the `multiple` attribute. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `required` | `boolean` | Mirrors the `required` attribute. |
| `size` | `number` | Mirrors the `size` attribute. |
| `form` (read-only) | `HTMLFormElement \| null` | The form this element belongs to. |
| `labels` (read-only) | `NodeList` | Labels associated with this element. |
| `validity` (read-only) | `ValidityState` |  |
| `validationMessage` (read-only) | `string` |  |
| `willValidate` (read-only) | `boolean` |  |

### Methods

| Method | Description |
|---|---|
| `item(index)` | The option at `index`. |
| `checkValidity()` |  |
| `reportValidity()` |  |
| `setCustomValidity(message)` |  |

### Events

| Event | Description |
|---|---|
| `input` | The user changed the selection. |
| `change` | The user changed the selection (fired right after `input`, like a native select). |

### CSS custom properties

| Property | Description |
|---|---|
| `--domkit-select-size` | Visible rows, from the `size` attribute. |
| `--domkit-highlight` | Background of selected options (shared token; see theme.css). |
| `--domkit-focus-ring` | Focus outline (shared token). |

<!-- api:end -->

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
- As with a native select, setting `value` to a value no option has selects nothing, and script changes never fire events.
