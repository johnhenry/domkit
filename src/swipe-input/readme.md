# swipe-input

Swipe gestures on the area it wraps send
[invoker commands](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API),
one per direction, as a `<button commandfor command>` would. Touch, pen,
and mouse all swipe. It pairs with [`<hot-key>`](../hot-key/readme.md)
and [`<gamepad-input>`](../gamepad-input/readme.md), so the same element
can be driven by keys, a controller, and swipes, with no script.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/swipe-input/global.mjs"></script>

<swipe-input commandfor="gallery" left="--next" right="--previous">
  <tabbed-ui id="gallery">…</tabbed-ui>
</swipe-input>
```

## Commands

`up`, `down`, `left`, and `right` each name the command a swipe in that
direction sends to the `commandfor` element: a custom `--command` (sent
as a `command` event) or a built-in one (`show-popover`, `toggle-popover`,
`show-modal`, …). A direction without an attribute sends nothing. The
direction is whichever axis the pointer moved further along, once it's
moved `threshold` CSS pixels (default 30).

Before the command, a cancelable `swipe` event fires with
`{ direction, distance }` in `detail`, also for directions without a
command, so a page can react to swipes directly.

### Without `commandfor`: inside what it controls

Leave out `commandfor` and a custom `--command` bubbles up instead: it's
dispatched on the <swipe-input> itself as a bubbling `command` event, for the
element it's inside to handle. Controls can then live inside what they
control, with no ids, and move (or leave) along with it:

```html
<game-player>
  <swipe-input up="--up" down="--down" left="--left" right="--right">…</swipe-input>
</game-player>
```

```js
player.addEventListener("command", (event) => move(event.command)); // event.source is the <swipe-input>
```

A built-in command (`show-modal`, …) still needs a `commandfor` target. If
`commandfor` names no element, nothing is sent: it doesn't bubble instead.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `commandfor` |  | `string` | The id of the element to send commands to. Without it, `--custom` commands bubble up from this element as `command` events, for an ancestor to handle. |
| `up` |  | `string` | The command for a swipe up (for example `--up`, or a built-in like `show-popover`). |
| `down` |  | `string` | The command for a swipe down. |
| `left` |  | `string` | The command for a swipe left. |
| `right` |  | `string` | The command for a swipe right. |
| `threshold` |  | `number` | How far, in CSS pixels, a pointer must travel to count as a swipe. Default 30. |
| `pointers` |  | `string` | Which pointers swipe: `touch`, `pen`, `mouse`, or a space-separated mix. Default: all of them. |
| `disabled` | `disabled` | `boolean` | Swipes do nothing. |

### Properties

| Property | Type | Description |
|---|---|---|
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `commandForElement` (read-only) | `Element \| null` | The element `commandfor` names. |

### Events

| Event | Description |
|---|---|
| `swipe` | A swipe was recognized, before its command is sent. `detail` is `{ direction, distance }`; cancel it to skip the command. Fired even when that direction has no command. |

<!-- api:end -->

## Styling

Without any CSS it's a block with `touch-action: none` (so a finger
swipes rather than scrolls the page) and `user-select: none`. Page CSS on
the element overrides both.

## Notes

- `pointers="touch"` limits swipes to touch screens; any space-separated
  mix of `touch`, `pen`, and `mouse` works.
- Only the primary pointer swipes, so a second finger doesn't start
  another.
