# create-mutable-nodelist

A `NodeList` you can add to and remove from. The result passes
`instanceof NodeList` and has `item()`, `length`, `forEach`, and
iteration, so it can go anywhere code expects a `NodeList`. It also has
`push`, `pop`, `shift`, and `unshift`.

## Usage

```js
import createMutableNodeList from "@johnhenry/domkit/create-mutable-nodelist";

const list = createMutableNodeList(...document.querySelectorAll("h2"));
list.push(document.querySelector("h1"));
list instanceof NodeList; // true
list.pop(); // the h1
for (const node of list) console.log(node.textContent);
```

## API

| Export | Description |
|---|---|
| default `createMutableNodeList(...nodes)` | Create a list, optionally with initial nodes |
| `MutableNodeList` | The prototype class. Use it for `instanceof` checks only, because calling `new MutableNodeList()` throws (`NodeList` isn't constructible) |

| Method | Description |
|---|---|
| `push(...nodes)` / `unshift(...nodes)` | Add to the end/start. Returns the new length. Throws if any argument isn't a `Node` |
| `pop()` / `shift()` | Remove from the end/start and return the node |
| `item(i = 0)` | Same as `list[i]` |

## How it works

It's an `Array` with `MutableNodeList.prototype` (which extends
`NodeList.prototype`) as its prototype, so indexing and `length` behave
like an array while the prototype chain says `NodeList`. Array methods
like `map` aren't available. Spread it first (`[...list].map(…)`).

Used by [live-query-selector](../live-query-selector/readme.md) for its
`useNodeList` option.
