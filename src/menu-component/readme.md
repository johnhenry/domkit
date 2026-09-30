# Menu Component

A keyboard-navigable, stateful menu/wizard element: children become
selectable items (arrow keys to move focus, enter/space to activate), and
activating one "pushes" its content (from a nested `<template>`) into view,
dispatching `pushed`/`popped`/`reset` events. `hash.mjs` optionally
connects a menu's push/pop state to `location.hash`.

No `global.mjs` yet — register the tag name yourself. Note: the *module*
has lived at three paths — `menu-component.component` (stuttered, since
"menu-component" already says it's a component), then `menu.component`
(0.0.7, dropped the stutter), now `menu-component` again (0.0.8, dropped
the `.component` suffix convention repo-wide — and since `menu` alone has
no hyphen and would collide with the native `<menu>` element, it landed
back on `menu-component` for a different reason than where it started).
The registered *tag name* has stayed `menu-component` throughout — `<menu>`
is a real native HTML element, and custom element names are required to
contain a hyphen anyway:

```javascript
import MenuComponent from "./index.mjs";
customElements.define("menu-component", MenuComponent);
```

## hash.mjs

```javascript
import { attach, detach } from "./hash.mjs";

const menu = document.getElementById("menu");
attach(menu); // connects pushed/popped to location.hash
// ...later, to disconnect:
detach(menu);
```
