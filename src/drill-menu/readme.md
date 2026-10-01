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

- **Items** are the element's children. An item with a screen drills
  into it, and any other item (a link, a button with its own `onclick`) is
  a *leaf* that simply behaves as itself.
- **Screens** come in two kinds:
  - a `<template>` inside the item, cloned fresh each time it opens
    (lightweight, but any state inside resets), or
  - a **live** child marked `data-screen="key"`, matching an item's
    `data-key`. It's shown and hidden in place, so form values and other
    state persist, and its fields stay in the DOM where an enclosing
    `<form>` submits them:

    ```html
    <form>
      <drill-menu>
        <button type="button" data-key="name">Name</button>
        <section data-screen="name">
          <label>Name <input name="name" /></label>
          <button type="button" data-back>Back</button>
        </section>
      </drill-menu>
    </form>
    ```
- **Back:** a `[data-back]` element inside the screen, <kbd>Esc</kbd>
  inside the screen, `pop()`, or an invoker command
  (`<button commandfor="menu-id" command="--back">`).
- **Focus** moves into the screen (its first focusable element, or the
  screen itself), and Back returns it to the item that opened the screen.
- Before the element upgrades, the items are visible and the templates
  are inert, so the menu reads as a plain list.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `screen` | `screen` | `string` | Key of the screen currently shown (absent = the list). Reflects; set it to navigate. |
| `disabled` | `disabled` | `boolean` | Items can't be activated, leave the tab order, and are marked aria-disabled. `push()`/`pop()` still work from script. |
| `sync-hash` | `syncHash` | `boolean` | Mirror the current screen in `location.hash`, so links and the browser's Back button work. |

### Properties

| Property | Type | Description |
|---|---|---|
| `items` (read-only) | `Element[]` | The items: element children other than templates and the screen. |
| `screen` | `string \| null` | Key of the open screen, or null. Setting it navigates. |
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `syncHash` | `boolean` | Mirrors the `sync-hash` attribute. |

### Methods

| Method | Description |
|---|---|
| `push(key, options)` | Show the screen of the item with this key (its `data-key`, or its position). Items without a template are leaves and can't be pushed. |
| `pop(options)` | Return to the list, restoring focus to the item that opened the screen. |

### Events

| Event | Description |
|---|---|
| `push` | A screen was shown. `event.detail` is `{ key, item }`. |
| `pop` | The menu returned to the list. `event.detail` is `{ key, item }` for the screen that closed. |

<!-- api:end -->

## Keyboard

The list is a single tab stop. <kbd>↑</kbd>/<kbd>↓</kbd> (or
<kbd>←</kbd>/<kbd>→</kbd>, swapped in right-to-left text) and <kbd>Home</kbd>/<kbd>End</kbd> move
between items, and <kbd>Enter</kbd>/<kbd>Space</kbd> activate.
<kbd>Esc</kbd> in a screen goes back.

## Styling

- Items that open a screen have `aria-expanded`, and `index.css` gives
  them a chevron.
- Template screens render into `[data-drill-screen]`. Live screens are
  your own `[data-screen]` elements. Both are labelled `region`s.
- Items are hidden with the `hidden` attribute while a screen is open.

## Notes

- `<template>` screens are re-created each time they open. Use a live
  `data-screen` child when state must persist.
- Form validation works across screens: if a form is submitted while a
  field in a hidden live screen is invalid, that screen opens, so the
  browser can focus the field and show its message.
- Menus nest: a screen can contain another `<drill-menu>`.
- An item's **key** is its `data-key`, or else its position (`"0"`, `"1"`, …).
- Like a `<details>` element's `toggle`, `push` and `pop` fire however the change happened (click, key, attribute, hash), since they report state, not user input.
