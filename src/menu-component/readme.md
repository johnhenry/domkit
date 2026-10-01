# menu-component

A keyboard-navigable menu that can drill down into sub-screens. Its
children become focusable items. Activating an item that contains a
`<template>` *pushes* that template's content into view in place of the
menu, until something inside it fires an "end" event, which *pops* back
to the menu. Activating an item with no template fires the menu's end
event instead, so it works as a leaf ("Quit", "Done"). Push/pop state is mirrored in a `pushed` attribute,
and optionally in `location.hash` via the `hash.mjs` companion.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/menu-component/global.mjs"
></script>

<menu-component id="menu">
  <div data-key="profile">
    Profile
    <template>
      <p>Your profile.</p>
      <button onclick="this.dispatchEvent(new Event('end', { bubbles: true }))">
        Back
      </button>
    </template>
  </div>
  <div data-key="settings">
    Settings
    <template><p>Settings…</p></template>
  </div>
  <div>Quit</div>
</menu-component>
```

`global.mjs` registers `<menu-component>`. (`<menu>` alone isn't possible:
custom element names must contain a hyphen, and `<menu>` is already a
native element.)

## Items and keys

| On | Attribute | Meaning |
|---|---|---|
| an item | `data-key` | Name used to push it (`menu.push("settings")`, `pushed="settings"`, `#settings`). Items without one are pushed by position |
| an item | `data-end-event` | Event name that pops *this* item's screen. Defaults to the menu's own |
| `<menu-component>` | `data-end-event` | Default event name that pops a pushed screen. Defaults to `end` |
| `<menu-component>` | `pushed` | Key or index of the screen currently pushed. Set it to push, remove it to pop |

## API

| Member | Description |
|---|---|
| `push(keyOrIndex = 0)` | Push an item's screen. Unknown keys fall back to the first item; numeric indexes wrap |
| `pop()` | Return to the menu |
| `pushed` | Get/set, same as the attribute. `null` pops |

## Events

All three bubble and are `composed`.

| Event | `detail` |
|---|---|
| `pushed` | `{ pushed, clicked }`: the key/index pushed, and the position (as a string) of the item last activated by click or keyboard |
| `popped` | `{ pushed, clicked }`, where `pushed` is the key/index that was just popped |
| `reset` | none. Fires whenever the menu (re)renders its item list |

## Keyboard

<kbd>←</kbd>/<kbd>↑</kbd> and <kbd>→</kbd>/<kbd>↓</kbd> move focus between
items (wrapping), and <kbd>Enter</kbd>/<kbd>Space</kbd> activate the
focused item. Items are focusable (`tabindex` is set on each), so
<kbd>Tab</kbd> reaches them.

## Styling

Items render inside a shadow root and are exposed as CSS parts:
`::part(content)` (the container) and `::part(item)` (each item).
`index.css` has a starting point.

## hash.mjs: sync with `location.hash`

```js
import { attach, detach } from "@johnhenry/domkit/menu-component/hash.mjs";

const menu = document.getElementById("menu");
attach(menu); // push → #key, pop → no hash, and a changed hash pushes
// ...later:
detach(menu); // removes all three listeners
```

`attach` takes over `window.onhashchange`. `detach` only clears it if it's
still the handler `attach` installed.
