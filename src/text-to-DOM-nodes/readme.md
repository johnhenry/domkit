# Text to DOM Nodes

Parse an HTML string into a live `NodeList` of DOM nodes. The inverse of
[DOM-nodes-to-text](../DOM-nodes-to-text/readme.md). Used
internally by [simple-element](../simple-element/readme.md) and
[shadow-dom.element](../shadow-dom.element/readme.md).

## Usage

```javascript
import textToDOMNodes from "../text-to-DOM-nodes/index.mjs";

const nodes = textToDOMNodes("<li>one</li><li>two</li>");
document.querySelector("ul").append(...nodes);
```
