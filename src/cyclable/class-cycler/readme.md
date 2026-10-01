# class-cycler

A setting that cycles through a fixed list of classes on some element:
a theme (`light → dark → system`), a density, a font size. It's remembered
in `localStorage`, restored on the next visit before anything is clicked,
and kept in sync across open tabs. Part of [cyclable](../readme.md).

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/cyclable/class-cycler/global.mjs"></script>

<class-cycler id="theme" target="html" classes="light,dark,system" storage-key="theme">
  <button>Theme: <output></output></button>
</class-cycler>
```

```css
html.dark { color-scheme: dark; }
```

Inside the element:

| Markup | Does |
|---|---|
| `<button>` | Click: go to the next value (wrapping) |
| `<button data-cycle="previous">` | Click: go to the previous value |
| `<button value="dark">` | Click: set that value. Gets `aria-pressed="true"` while it's current, so a set of these is an accessible toggle group |
| `<output>` | Shows the current value |

Buttons **anywhere** on the page can drive it with
[invoker commands](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API),
with no script:

```html
<button commandfor="theme" command="--next">Next theme</button>
<button commandfor="theme" command="--previous">Previous theme</button>
<button commandfor="theme" command="--set" value="dark">Dark</button>
```

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `classes` |  | `string` | Comma-separated values to cycle through. An empty entry means "no class". |
| `target` |  | `string` | Selector for the element(s) whose class is set. Default `html`. |
| `storage-key` | `storageKey` | `string` | localStorage key to persist under. Without it, the value isn't persisted. |
| `value` | `value` | `string` | The current value. Reflects; set it to choose the initial value when nothing is stored. |
| `disabled` | `disabled` | `boolean` | Its buttons are disabled, and invoker commands are ignored. |

### Properties

| Property | Type | Description |
|---|---|---|
| `values` (read-only) | `string[]` | The values to cycle through, in order. |
| `value` | `string` | The current value. Setting it applies and persists it, without an event. |
| `targets` (read-only) | `Element[]` | The elements whose class is set. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `storageKey` | `string` | Mirrors the `storage-key` attribute. |

### Methods

| Method | Description |
|---|---|
| `next()` | Move to the next value (wrapping), without an event. |
| `previous()` | Move to the previous value (wrapping), without an event. |

### Events

| Event | Description |
|---|---|
| `change` | The user changed the value with a button or command. |

<!-- api:end -->

## Notes

- Inside a `<form>`, give the buttons `type="button"` so they don't submit.
- For a JS-only version without an element, see
  [localstorage-class-cycler](../localstorage-class-cycler/readme.md).
- Only the cycle's own classes are added and removed. Other classes on the targets are untouched.
- When another tab changes the stored value, this page follows it. No event fires, since this page's user didn't act.
