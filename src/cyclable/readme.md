# cyclable

Cycle a setting through a fixed list of values (`light → dark → system`,
`compact → comfortable`, and so on) and remember it in `localStorage`, so
it survives reloads. Typically used for theme toggles.

Three layers. Use the highest one that fits:

| Module | What you write | What it does |
|---|---|---|
| [attribute-cycler](./attribute-cycler/readme.md) | `<attribute-cycler values="light,dark" …><button>…</button></attribute-cycler>` | The element: buttons inside (or invoker commands from anywhere) cycle a class, or any attribute, on a target |
| [localstorage-attribute-cycler](./localstorage-attribute-cycler/readme.md) | `localStorageAttributeCycler(el, key, values, { attribute })` | The same, as a JS function |
| [localstorage-cycler](./localstorage-cycler/readme.md) | `localStorageCycler(key, handler?, ...values)` | The engine: a persisted value with `next`/`previous`/`peek`/`set` |

## Quick start

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/cyclable/attribute-cycler/global.mjs"
></script>

<attribute-cycler target="html" values="light,dark" storage-key="theme">
  <button>Theme: <output></output></button>
</attribute-cycler>
```

```css
html.dark { color-scheme: dark; }
```

On first load the first value (or the `value` attribute) is applied.
Once the user picks one, it's stored, restored on every page load before
anything is clicked, and kept in sync across open tabs.

## Notes

- Values persist per origin under the `storage-key` you choose. Two
  cyclers with the same key share one value.
