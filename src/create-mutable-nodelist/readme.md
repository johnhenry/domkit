# Create-Mutable-NodeList

Create a mutable "subclass" (not technically a subclass) of NodeList.

Adds **push**, **pull**, **shift**, and **unshift** methods.

Note: the MutableNodeList is available as an export, but it cannot be used directly as a constructor. Use the default factory export instead.

```javascript
import createMutableNodeList from "...";
const nodeList = createMutableNodeList(...document.querySelectorAll("*"));
```
