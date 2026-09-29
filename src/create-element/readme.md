# CreateElement

An alternative to [`document.createElement`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement).

Create an element with attributes and children all in one go.

Similar to [React's JSX-less UI](https://reactjs.org/docs/react-without-jsx.html).

## Usage + API

### createElement

The main export (below named "createElement") is analogous to `document.createElement` on the global object. When passed a single argument, they work similarly.

```javascript
import createElement from "./index.mjs";
const div0 = createElement("div");
const div1 = window.document.createElement("div", { class: "foo" });
console.log(div0.outerHTML); // <div></div>;
console.log(div1.outerHTML); // <div></div>;
```

### Attributes

Pass a second argument to createElement to set the returned element's attributes.

Attributes are passed "as-is", that is, no translation from["camelCase"](https://en.wikipedia.org/wiki/Letter_case#Camel_case) to ["kebab-case"](https://en.wikipedia.org/wiki/Letter_case#Kebab_case) as with some libraries and frameworks.

```javascript
const div createElement("div", { id: "foo", ["data-bar"]: "baz" });
console.log(div.outerHTML);
// <div id="foo" data-bar="baz"></div>
```

#### "class" Attribute

The class key in the attributes argument
can corespond to can be a strin
g _or_ an array of strings.

In the latter case, each element of the array is added to the object's classList.

```javascript
import { DIV } from "./tags.mjs";
console.log(DIV({ class: ["foo", "bar", "baz"] }).outerHTML);
// <div class="foo bar baz"></div>
```

### children

Add children at creation by passing instances of HTMLElement after the attributes object. Strings are converted into text nodes.

Note: instances may be created through `createElement`, `document.createElement`, or any other means.

```javascript
const list = createElement("ul",{ id: "foo" },
  createElement("li", { }, "bar),
  document.createElement("li")
);
console.log(list.outerHTML);
// <ul id="foo">
//   <li>bar</li>
//   <li></li>
// </ul>
```

#### attributes.children

Alternatively, pass a "children" array of HTMLElements to the attributes object. This will be prepended to rest of the children.

```javascript
const list = createElement("ul", { id:"foo",
  children: [
    createElement("li", { }, "bar),
    document.createElement("li")] });
    console.log(list.outerHTML);
// <ul id="foo">
//   <li>bar</li>
//   <li></li>
// </ul>
```

This is done for compataibility with some libraries and frameworks.

```json
//file:///tsconfig.json
{
  "compilerOptions": {
    "jsxInject": "import createElement from '??",
    "jsxFactory": "createElement",
    "jsxFragment": "''"

  }
}

export const jsxInject = `import _jsx from "https://esm.sh/@johnhenry/domkit/create-element/index.mjs";`;
export const jsxFactory = "_jsx";
export const jsxFragment = "''";
```

```jsx
//file:///index.jsx
const list = (
  <ul id="foo">
    <li>bar</li>
    <li></li>
  </ul>
);
console.log(list.outerHTML);
// <ul id="foo">
//   <li>bar</li>
//   <li></li>
// </ul>
```

```jsx
//file:///index2.jsx
/** @jsx ce */
import ce from "./createElement.mjs";
const list = (
  <ul id="foo">
    <li>bar</li>
    <li></li>
  </ul>
);
// const list = createElement("ul", { id: "foo" },
//   createElement("li", { }, "bar),
//   document.createElement("li")
// );
console.log(list.outerHTML);
// <ul id="foo">
//   <li>bar</li>
//   <li></li>
// </ul>
```

```jsx
//file:///index2.js
/** @jsx ce */
import ce from "./createElement.mjs";
const list = ce("ul", { id: "foo" },
  createElement("li", { }, "bar),
  document.createElement("li")
);
console.log(list.outerHTML);
// <ul id="foo">
//   <li>bar</li>
//   <li></li>
// </ul>
```

### Omission

The attributes object is optional.

```javascript
createElement("ul", createElement("li"));
// <ul>
//   <li></li>
// </ul>
```

The tagName is optional. If omitted, a DocumentFragment is returned.

```javascript
createElement(createElement("li"), createElement("li"), createElement("li"));
// <li></li>
// <li></li>
// <li></li>
```

The library exports a shorthand, `_`, for crating fragments.

```javascript
import { _ } from "./index.mjs";
_(createElement("li"), createElement("li"), createElement("li"));
// <li></li>
// <li></li>
// <li></li>
```

### HTML Elements

The library exports a shorthand for every existing HTML and SVG tag.

- Most tags are exported in lowercase ("div", "span", "textarea", etc.),
- Some tags are exported uppercased ("Switch", "Var"),
- Some (specifically SVG) tags -- are exported as camelCase ("radialGradient", "textArea", etc.).

```javascript
import { html, head, title, body } from "./index.mjs";
html(
  { lang: "en" },
  head({}, title({}, "Hello")),
  body({ id: "foo" }, "world")
);
// <html lang="en">
//   <head>
//     <title>Hello</title>
//   </head>
//   <body id="foo">world</body>
// </html>
```

#### Omission

The attributes object can be omitted here as well.

```javascript
import { HTML, HEAD, TITLE, BODY } from "./index.mjs";
html(head(title("Hello")), body("world"));
// <html>
//   <head>
//     <title>Hello</title>
//   </head>
//   <body>world</body>
// </html>
```
