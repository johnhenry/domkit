# Define Tag

A curried `customElements.define` wrapper: `(elementClass) => (name) =>
customElements.define(name, elementClass)`. Useful for separating "what a
component's class is" from "what tag name it gets registered under" —
several component modules' `define.mjs`/`global.mjs` files use this
instead of calling `customElements.define` directly. See
[define-component-by-content](../define-component-by-content/readme.md)
for a real consumer.

## Usage

```js
import definetag from "../definetag/index.mjs";
import MyComponent from "./my-component.mjs";

definetag(MyComponent)("my-component");
```
