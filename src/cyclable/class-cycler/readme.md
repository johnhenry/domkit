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

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `classes` | `values` (read-only array) | Comma-separated values. An empty entry means "no class": `classes=",compact"` toggles one class |
| `target` | `targets` (read-only) | Selector for the element(s) to set the class on. All matches. Default `html` |
| `storage-key` | `storageKey` | `localStorage` key. Without it, the value isn't persisted |
| `disabled` | `disabled` | Its buttons are disabled (and restored afterwards), and invoker commands are ignored |
| `value` | `value` | The current value. Reflects. In markup, it's the initial value when nothing is stored |

Only the cycle's own classes are added and removed, and other classes on
the targets are untouched.

## Methods and events

| | |
|---|---|
| `next()`, `previous()`, `value = …` | Change the value from script. Like setting a native control's value, these fire no event |
| `change` event | The user changed the value with a button or command |

When another tab changes the stored value, this page follows it (no
event, since this page's user didn't act).

## Notes

- Inside a `<form>`, give the buttons `type="button"` so they don't submit.
- For a JS-only version without an element, see
  [localstorage-class-cycler](../localstorage-class-cycler/readme.md).
