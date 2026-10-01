# definable

Get code onto a page from HTML alone: register custom elements, load
globals, and hide content until everything is ready, without writing a
`<script>` for each step.

| Module | You have… | It does |
|---|---|---|
| [define-component](./define-component/readme.md) | a module that exports an element class | `<define-component name="my-widget" src="./my-widget.mjs">` imports it and registers `<my-widget>` |
| [define-component-by-content](./define-component-by-content/readme.md) | a snippet of markup | `<define-component-by-content name="my-callout" content="…">` registers a tag that renders it |
| [polyfill-window](./polyfill-window/readme.md) | a module that should live on `window` | `<polyfill-window name="shout" src="./shout.mjs">` imports it and assigns `window.shout` |
| [until-window-load](./until-window-load/readme.md) | content that flashes before it's ready | removes a "hidden until loaded" class once `window` fires `load` |
| [definetag](./definetag/readme.md) | an element class, in JS | `definetag(Class)("tag-name")`, a curried `customElements.define` |

## Quick start

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/until-window-load/global.mjs"></script>
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"></script>
<style>
  .until-window-load { visibility: hidden; }
</style>

<define-component name="fancy-card" src="./fancy-card.mjs"></define-component>
<fancy-card class="until-window-load">…</fancy-card>
```

## Notes

- `define-component` and `polyfill-window` resolve a relative `src`
  against the **page's** URL (via the shared
  [`resolve-relative-url.mjs`](./resolve-relative-url.mjs)), not against
  their own module's location.
- A tag name can only be registered once per page. `define-component`
  skips a name that's already registered (and warns if you add `force`,
  because the platform has no way to re-register).
