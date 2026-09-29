# Menu Component

A keyboard-navigable, stateful menu/wizard element: children become
selectable items (arrow keys to move focus, enter/space to activate), and
activating one "pushes" its content (from a nested `<template>`) into view,
dispatching `pushed`/`popped`/`reset` events. `hash.mjs` optionally
connects a menu's push/pop state to `location.hash`.

No `global.mjs` yet — register the tag name yourself:

```javascript
import MenuComponent from "../menu-component.component/index.mjs";
customElements.define("menu-component", MenuComponent);
```

## hash.mjs

```javascript
import { attach, detach } from "../menu-component.component/hash.mjs";

const menu = document.getElementById("menu");
attach(menu); // connects pushed/popped to location.hash
// ...later, to disconnect:
detach(menu);
```
