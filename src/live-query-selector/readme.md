# live-query-selector

`querySelectorAll`, but the result stays current. The returned array is
refreshed in place whenever elements are added to or removed from the
root, so a reference you're holding always reflects the DOM.

## Usage

```js
import liveQuerySelector from "@johnhenry/domkit/live-query-selector";

const items = liveQuerySelector("li.todo", document.getElementById("list"));
items.length; // 3
document.getElementById("list").append(newTodo);
// after the MutationObserver callback (a microtask later):
items.length; // 4

items.stop(); // when you no longer need updates
```

## API

`liveQuerySelector(selector, root = document, useNodeList = false)`

| Parameter | Description |
|---|---|
| `selector` | Any CSS selector |
| `root` | Element (or document) to search within and watch |
| `useNodeList` | Return a [MutableNodeList](../create-mutable-nodelist/readme.md) instead of an array |

The result has a non-enumerable `stop()` method that disconnects the
underlying `MutationObserver`. Call it when you're done, or the observer
lives as long as `root` does.

## Notes

- Updates are asynchronous (they happen in a `MutationObserver` callback),
  so the list catches up one microtask after the DOM changes.
- Only additions and removals (`childList`, whole subtree) are watched.
  An element that starts or stops matching because an **attribute**
  changed (a class toggled, say) won't be picked up until the next
  addition or removal under `root`.
- The whole list is re-queried on every change, which is fine for
  ordinary pages but expensive under a heavy mutation load.
