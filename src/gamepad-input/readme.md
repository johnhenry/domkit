# gamepad-input

A game controller's buttons send
[invoker commands](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API),
as a `<button commandfor command>` per button would. It pairs with
[`<hot-key>`](../hot-key/readme.md) and
[`<swipe-input>`](../swipe-input/readme.md), so the same element can be
driven by keys, a controller, and swipes, with no script.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/gamepad-input/global.mjs"></script>

<gamepad-input commandfor="player" up="--up" down="--down" left="--left" right="--right" start="--toggle"></gamepad-input>
```

## Buttons

Each attribute is a button in the
[standard gamepad mapping](https://w3c.github.io/gamepad/#remapping), and
its value is the command to send to the `commandfor` element (a custom
`--command`, sent as a `command` event, or a built-in one):

| Attribute | Button |
|---|---|
| `a`, `b`, `x`, `y` | Face buttons: bottom, right, left, top |
| `lb`, `rb`, `lt`, `rt` | Bumpers and triggers |
| `select`, `start`, `home` | The middle buttons |
| `ls`, `rs` | Pressing the sticks in |
| `up`, `down`, `left`, `right` | The d-pad, or the left stick pushed past halfway |

A command is sent when a button goes down, once; holding it doesn't
repeat. Before the command, a cancelable `gamepadpress` event fires with
`{ button, gamepad }` in `detail`, for every button, mapped or not.

## Without `commandfor`: inside what it controls

Leave out `commandfor` and a custom `--command` bubbles up instead: it's
dispatched on the <gamepad-input> itself as a bubbling `command` event, for the
element it's inside to handle. Controls can then live inside what they
control, with no ids, and move (or leave) along with it:

```html
<game-player>
  <gamepad-input up="--up" down="--down" left="--left" right="--right" a="--jump"></gamepad-input>
</game-player>
```

```js
player.addEventListener("command", (event) => move(event.command)); // event.source is the <gamepad-input>
```

A built-in command (`show-modal`, …) still needs a `commandfor` target. If
`commandfor` names no element, nothing is sent: it doesn't bubble instead.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `commandfor` |  | `string` | The id of the element to send commands to. Without it, `--custom` commands bubble up from this element as `command` events, for an ancestor to handle. |
| `index` |  | `number` | Which controller (0 is the first connected). Default: any. |
| `up` |  | `string` | The command for the d-pad (or left stick) up. Likewise `down`, `left`, and `right`. |
| `a` |  | `string` | The command for the bottom face button. Likewise `b` (right), `x` (left), `y` (top), `lb`, `rb`, `lt`, `rt`, `select`, `start`, `ls`, `rs`, and `home`. |
| `disabled` | `disabled` | `boolean` | Button presses do nothing. |

### Properties

| Property | Type | Description |
|---|---|---|
| `disabled` | `boolean` | Mirrors the `disabled` attribute. |
| `commandForElement` (read-only) | `Element \| null` | The element `commandfor` names. |

### Events

| Event | Description |
|---|---|
| `gamepadpress` | A button went down, before its command is sent. `detail` is `{ button, gamepad }`; cancel it to skip the command. Fired even when that button has no command. |

<!-- api:end -->

## Notes

- `index` picks one controller (0 is the first connected); without it,
  any connected controller works.
- The Gamepad API only reports state, so it polls on animation frames, and
  only while a controller is connected and the element is in the page.
  Browsers expose a controller after its first button press.
- A button already held when it starts watching isn't a press.
