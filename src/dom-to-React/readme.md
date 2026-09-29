# dom-to-React

Convert a real DOM node into a React-element-shaped plain object
(`$$typeof`, `type`, `props`, etc.) — the reverse of
[react-to-dom](../react-to-dom/readme.md).

## Usage

```js
import domToReact from "../dom-to-React/index.mjs";

const reactElement = domToReact(document.querySelector("#app"));
```
