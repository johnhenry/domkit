# live-query-selector

`querySelectorAll`, but the result stays current. The returned array is
refreshed in place whenever elements are added to or removed from the
root, so a reference you're holding always reflects the DOM, and it fires
`change` when its contents change.

## Usage

```js
import liveQuerySelector from "@johnhenry/domkit/live-query-selector";

const items = liveQuerySelector("li.todo", document.getElementById("list"));
items.length; // 3
items.addEventListener("change", () => render(items));
document.getElementById("list").append(newTodo);
// a microtask later: items.length is 4, and "change" has fired

items.stop(); // when you no longer need updates
```

## API

`liveQuerySelector(selector, root = document, { attributes })`

| Parameter | Description |
|---|---|
| `selector` | Any CSS selector |
| `root` | Element (or document) to search within and watch |
| `attributes` | Also watch attribute changes: `true` for any attribute, or a list of names (`["class"]`) to limit the work. Default `false` |

It returns a plain array of elements, with three non-enumerable extras:

| Member | Description |
|---|---|
| `addEventListener("change", listener)` | Called after the array's contents change (an element matched or stopped matching, or the order changed). Not called when the DOM changes but the matches don't. |
| `removeEventListener("change", listener)` | Stop listening. |
| `stop()` | Disconnect the underlying `MutationObserver`. Call it when you're done, or the observer lives as long as `root` does. |

## Notes

- Updates are asynchronous (they happen in a `MutationObserver` callback),
  so the list catches up one microtask after the DOM changes. Listen for
  `change` rather than reading it right after a mutation.
- By default only additions and removals (`childList`, whole subtree) are
  watched, so an element that starts or stops matching because an
  **attribute** changed (a class toggled, say) is only picked up at the
  next addition or removal under `root`. Pass `attributes` to watch those
  too; a list of names (`{ attributes: ["class"] }`) keeps it cheap.
- The whole list is re-queried on every change, which is fine for
  ordinary pages but expensive under a heavy mutation load.
