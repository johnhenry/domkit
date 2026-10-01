# drill-menu

A list of items where choosing one "drills in" to its own screen, and
Back returns to the list: the settings-menu, mobile-navigation, or
step-by-step pattern. Each item's screen is a `<template>` inside it, so
there's nothing to wire up. Everything stays in the light DOM, so
ordinary CSS styles it.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/drill-menu/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/drill-menu/index.css" />

<drill-menu sync-hash>
  <button data-key="profile">
    Profile
    <template>
      <h2>Profile</h2>
      <label>Name <input /></label>
      <button data-back>Back</button>
    </template>
  </button>
  <button data-key="notifications">
    Notifications
    <template>…</template>
  </button>
  <a href="/logout">Log out</a>
</drill-menu>
```

- **Items** are the element's children. An item with a `<template>`
  drills into it; any other item (a link, a button with its own
  `onclick`) is a *leaf* and simply behaves as itself.
- **Back:** a `[data-back]` element inside the screen, <kbd>Esc</kbd>
  inside the screen, `pop()`, or an invoker command
  (`<button commandfor="menu-id" command="--back">`).
- **Focus** moves into the screen (its first focusable element, or the
  screen itself), and Back returns it to the item that opened the screen.
- Before the element upgrades, the items are visible and the templates
  are inert, so the menu reads as a plain list.

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `screen` | `screen` | Key of the open screen (absent = the list). Reflects. Set it to navigate, or write it in markup to start on a screen |
| `sync-hash` | `syncHash` | Mirror the screen in `location.hash`: drilling in adds a history entry, the browser's Back button goes back, and links like `#profile` open screens. Use it on one menu per page |

An item's **key** is its `data-key`, or else its position (`"0"`,
`"1"`, …).

## Methods and events

| | |
|---|---|
| `push(key)` | Open that item's screen. Returns `false` if it has none |
| `pop()` | Back to the list |
| `items` | The items (read-only) |
| `push` event | A screen opened. `detail: { key, item }` |
| `pop` event | A screen closed, including when switching directly to another screen. `detail: { key, item }` |

Like a `<details>` element's `toggle`, these fire however the change
happened (click, key, attribute, hash), since they report state, not
user input.

## Keyboard

The list is a single tab stop. <kbd>↑</kbd>/<kbd>↓</kbd> (or
<kbd>←</kbd>/<kbd>→</kbd>) and <kbd>Home</kbd>/<kbd>End</kbd> move
between items, and <kbd>Enter</kbd>/<kbd>Space</kbd> activate.
<kbd>Esc</kbd> in a screen goes back.

## Styling

- Items that open a screen have `aria-expanded`, and `index.css` gives
  them a chevron.
- The screen container is `[data-drill-screen]` (a labelled `region`).
- Items are hidden with the `hidden` attribute while a screen is open.

## Notes

- Screens are re-created from the template each time they open, so form
  state inside a screen doesn't persist between visits. Keep anything
  that must persist outside the template.
- Menus nest: a screen can contain another `<drill-menu>`.
