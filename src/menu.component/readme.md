# Menu Component

A keyboard-navigable, stateful menu/wizard element: children become
selectable items (arrow keys to move focus, enter/space to activate), and
activating one "pushes" its content (from a nested `<template>`) into view,
dispatching `pushed`/`popped`/`reset` events. `hash.mjs` optionally
connects a menu's push/pop state to `location.hash`.

No `global.mjs` yet — register the tag name yourself. Note: the *module*
lives at `menu.component` (renamed from `menu-component.component` — the
old name stuttered, since "menu-component" already says it's a component
before `.component` is even appended), but the registered *tag name*
stays `menu-component` — `<menu>` is a real native HTML element, and
custom element names are required to contain a hyphen anyway:

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
