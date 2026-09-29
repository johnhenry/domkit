# textElement

Create HTML Components using simple HTML Text strings.

## Creating elements

- The module provides two exports: _shadowOpen_ and _shadowClosed_.
- Pass an HTML string to either to create an element derived from _globalThis.HTMLElement_.
- Use the resulting class as the second argument to _globalThis.customElements.define_.
- Each can be used as a regular function or as a [tag function](https://2ality.com/2016/11/computing-tag-functions.html).

### Regular function usage

```javascript
import { shadowOpen } from "./textElement.mjs";
const HTMLString = "<div>I am HTML</div>";
const SampleElementClass = shadowOpen(HTMLString);
globalThis.customElements.define("sample-element", SampleElementClass);
```

### Tag function usage

```javascript
import { shadowClosed } from "./textElement.mjs";
globalThis.customElements.define(
  "sample-element",
  shadowClosed`<div>I am HTML</div>`
);
```

### shadowOpen vs shadowClosed

_shadowOpen_ creates an element with an accessible shadowRoot.

```javascript
globalThis.customElements.define(
  "open-element",
  shadowOpen`<div>I am open</div>`
);
//...
globalThis.console.log(
  globalThis.document.getElementsByTagName("open-element")[0].shadowRoot
); //Logs element
```

_shadowClosed_ creates an element with an inaccessible shadowRoot.

```javascript
globalThis.customElements.define(
  "closed-element",
  shadowClosed`<div>I am open</div>`
);
//...
globalThis.console.log(
  globalThis.document.getElementsByTagName("closed-element")[0].shadowRoot
); //Logs null
```

## Composing elements

Use the _slot_ element within the HTML string to allow for other HTML elements to be embedded.

```javascript
globalThis.customElements.define(
  "composable-element",
  shadowOpen`<div><slot /></div>`
);
```

```html
<composable-element> I'm dynamic content </composable-element>
```

Renders like:

```html
<div>I'm dynamic content</div>
```

### Composing content in an open shadow root, with no styling

For the common case of wrapping content in a shadow root with no other
markup, skip the wrapper element entirely:

```javascript
globalThis.customElements.define("plain-shadow", shadowOpen`<slot />`);
```

### Named Slots

Used named slots to place multiple pieces content within an element.

```javascript
globalThis.customElements.define(
  "composable-element",
  shadowOpen`<slot name="first" /><slot name="second" />`
);
```

```html
<composable-element>
  <span slot="second">2nd</span>
  <span slot="first">1st</span>
</composable-element>
```

Renders like:

```html
<div>
  <span>1st</span>
  <br />
  <span>2nd</span>
</div>
```

## Styling Elements

Elements can be styled by adding a _style_ tag to the HTML string.

Because the style tag exists within the shadowRoot, styles will only be applied within the element.

```javascript
const RedTextClass = shadowOpen`<style>*{color:red}</style><slot />`;
```

### Styling slotted elements

Slotted elements exist outside of the shadowRoot and can be styled outside of the element.

```javascript
globalThis.customElements.define("red-element", RedTextClass);
```

```html
<style>
  .blue {
    color: blue;
  }
</style>
<red-element>
  <span class="blue">This text is blue</span>
</red-element>
```

### Using ::part() sudo-element

Parts of the element intended to be the target of external styles can be marked with the _part_ attribute.

```javascript
globalThis.customElements.define('stylable-element', shadowOpen`<div part=content> I'm stylable externally</div>`;
```

```html
<style>
  stylable-element::part(content) {
    color: blue;
  }
</style>
<stylable-element />
```
