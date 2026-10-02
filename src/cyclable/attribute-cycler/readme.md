# attribute-cycler

A setting that cycles through a fixed list of values on some element: a
theme (`light → dark → system`), a density, a font size. By default the
value is a class on the target; with `attribute`, it's any attribute's
value instead (`data-theme="dark"`). It's remembered in `localStorage`,
restored on the next visit before anything is clicked, and kept in sync
across open tabs. Part of [cyclable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/cyclable/attribute-cycler/global.mjs"></script>

<attribute-cycler id="theme" target="html" values="light,dark,system" storage-key="theme">
  <button>Theme: <output></output></button>
</attribute-cycler>
```

```css
html.dark { color-scheme: dark; }
```

Or set an attribute, for stylesheets written against `[data-theme]`:

```html
<attribute-cycler attribute="data-theme" values="light,dark" storage-key="theme">…</attribute-cycler>
```

```css
html[data-theme="dark"] { color-scheme: dark; }
```

Inside the element:

| Markup | Does |
|---|---|
| `<button>` | Click: go to the next value (wrapping) |
| `<button data-cycle="previous">` | Click: go to the previous value |
| `<button data-cycle="reset">` | Click: forget the stored choice and go back to the default (the `value` attribute as written, or the first value) |
| `<button value="dark">` | Click: set that value. Gets `aria-pressed="true"` while it's current, so a set of these is an accessible toggle group |
| `<output>` | Shows the current value |

Buttons **anywhere** on the page can drive it with
[invoker commands](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API),
with no script:

```html
<button commandfor="theme" command="--next">Next theme</button>
<button commandfor="theme" command="--previous">Previous theme</button>
<button commandfor="theme" command="--set" value="dark">Dark</button>
<button commandfor="theme" command="--reset">Use the default</button>
```

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `values` | `values` | `string` | Comma-separated values to cycle through. An empty entry means "none": no class, or no attribute. |
| `attribute` | `attribute` | `string` | The attribute to set on the targets. Default `class`, where the value is one class among the target's others; any other attribute gets the value as its whole value. |
| `target` |  | `string` | Selector for the element(s) whose attribute is set. Default `html`. |
| `storage-key` | `storageKey` | `string` | localStorage key to persist under. Without it, the value isn't persisted. |
| `value` | `value` | `string` | The current value. Reflects; set it to choose the initial value when nothing is stored. |
| `disabled` | `disabled` | `boolean` | Its buttons are disabled, and invoker commands are ignored. |

### Properties

| Property | Type | Description |
|---|---|---|
| `values` (read-only) | `string[]` | The values to cycle through, in order. |
| `attribute` | `string` | The attribute set on the targets. Mirrors the `attribute` attribute. |
| `value` | `string` | The current value. Setting it applies and persists it, without an event. |
| `targets` (read-only) | `Element[]` | The elements whose attribute is set. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `storageKey` | `string` | Mirrors the `storage-key` attribute. |

### Methods

| Method | Description |
|---|---|
| `next()` | Move to the next value (wrapping), without an event. |
| `previous()` | Move to the previous value (wrapping), without an event. |
| `reset()` | Forget the stored value and go back to the default (the `value` attribute as first written, or the first value), without an event. |

### Events

| Event | Description |
|---|---|
| `change` | The user changed the value with a button or command. |

<!-- api:end -->

## Notes

- Inside a `<form>`, give the buttons `type="button"` so they don't submit.
- For a JS-only version without an element, see
  [localstorage-attribute-cycler](../localstorage-attribute-cycler/readme.md).
- With `attribute="class"` (the default), only the cycle's own classes are added and removed; other classes on the targets are untouched. With another attribute, the attribute's whole value is set, and an empty value removes it.
- Changing `attribute` or `target` removes what was set on the old attribute or targets (only if it's still one of the cycle's values).
- When another tab changes the stored value, this page follows it. No event fires, since this page's user didn't act.
