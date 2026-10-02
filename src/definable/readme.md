# definable

Get code onto a page from HTML alone: register custom elements, load
globals, and hide content until everything is ready, without writing a
`<script>` for each step.

| Module | You have… | It does |
|---|---|---|
| [define-component](./define-component/readme.md) | a module that exports an element class, or a snippet of markup | `<define-component name="my-widget" src="./my-widget.mjs">` imports it and registers `<my-widget>`; `<define-component name="my-callout"><template>…</template></define-component>` registers a tag that renders the markup |
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
  against the document's base URL, and fire `load`/`error`, just like
  `<script src>`. Their `ready` promise resolves when they're done.
- A tag name can only be registered once per page. A second
  `<define-component>` for the same name is a no-op that still reports
  success.
