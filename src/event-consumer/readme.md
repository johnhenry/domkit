# event-consumer

An invisible (`display: contents`) wrapper that handles events from its
children with inline code, like `onclick` but for any list of event types,
and that by default **stops** those events from propagating any further.
Useful for containing noisy events, or wiring a quick handler without a
script block.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/event-consumer/global.mjs"
></script>

<event-consumer events="click, keydown" onevent="console.log(event.type, event.target)">
  <button>Click me, or focus me and press a key</button>
</event-consumer>
```

## Attributes

| Attribute | Description |
|---|---|
| `events` | Comma-separated event types to listen for (on the element itself, so bubbling events from any descendant count) |
| `onevent` | A function **body**, run with `event` in scope and `this` as the element. Invalid code is ignored silently |
| `bubbles` | If present, events continue propagating after the handler runs. By default they're stopped here |

Both `events` and `onevent` can be changed at any time.

## Notes

- `onevent` is compiled with `new Function`, so a page with a strict
  Content-Security-Policy (no `unsafe-eval`) can't use it.
- Non-bubbling events such as `focus` and `mouseenter` from children never
  reach the wrapper. Use their bubbling counterparts (`focusin`,
  `mouseover`).
