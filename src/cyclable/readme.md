# cyclable

Cycle a setting through a fixed list of values (`light → dark → system`,
`compact → comfortable`, and so on) and remember it in `localStorage`, so
it survives reloads. Typically used for theme toggles.

Four layers. Use the highest one that fits:

| Module | What you write | What it does |
|---|---|---|
| [class-cycler-button](./class-cycler-button/readme.md) | `<button is="class-cycler-button" …>` | A button that cycles a class on some element each click |
| [class-cycler](./class-cycler/readme.md) | `<class-cycler global="cycleTheme" …>` | Exposes the cycler as a global function, for any trigger you like |
| [localstorage-class-cycler](./localstorage-class-cycler/readme.md) | `localStorageClassCycler(el, key, ...classes)` | The cycler as a function that applies the value as a class |
| [localstorage-cycler](./localstorage-cycler/readme.md) | `localStorageCycler(key, handler?, ...values)` | The engine: persisted value + `next`/`previous`/`peek`/`set` |

## Quick start

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/cyclable/class-cycler/global.mjs"
></script>

<class-cycler
  global="cycleTheme"
  selector="html"
  storage-key="theme"
  classes="light,dark"
></class-cycler>
<button onclick="cycleTheme()">Toggle theme</button>
```

```css
html.dark { color-scheme: dark; }
```

On first load the first value is stored and applied. After that, the
stored value is restored on every page load, before any click.

## Notes

- `class-cycler-button` is a customized built-in (`<button is=…>`), which
  **Safari doesn't support**. `class-cycler` (a plain element plus your
  own `<button>`) works everywhere.
- Values persist per origin under the `storage-key` you choose. Two
  cyclers with the same key share one value.
