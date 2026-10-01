# shadow-dom

> **Deprecated.** This is exactly
> [`@johnhenry/domable`](https://github.com/johnhenry/domable)'s
> `` shadowOpen`<slot />` ``, kept so existing imports don't break. Use
> domable directly in new code.

An element class with an open shadow root containing a single `<slot>`,
so its children render exactly as they would without it. It's a
minimal shadow host, handy for `::slotted()` experiments or as a starting
point. (A `<style>` written among its children stays in the light DOM
and still styles the whole page.)

```js
// before
import ShadowDom from "@johnhenry/domkit/shadow-dom";
customElements.define("shadow-dom", ShadowDom);

// after
import { shadowOpen } from "@johnhenry/domable/simple-element";
customElements.define("shadow-dom", shadowOpen`<slot />`);
```

```html
<shadow-dom>
  <p>Slotted content</p>
</shadow-dom>
```
