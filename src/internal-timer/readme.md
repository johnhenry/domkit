# internal-timer

A frame-paced clock as an element: while connected, it dispatches a
bubbling `tick` event at a steady rate (`fps`, default 60), driven by
`requestAnimationFrame` through [frame-delay](../frame-delay/readme.md).
Send it a `pause` event to stop it, either for a while or until it's
reconnected.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/internal-timer/global.mjs"
></script>

<internal-timer fps="30" id="clock">running</internal-timer>

<script type="module">
  const clock = document.getElementById("clock");
  clock.addEventListener("tick", () => {
    /* advance one step of an animation, game loop, etc. */
  });
  // pause for one second, then resume automatically:
  clock.dispatchEvent(new CustomEvent("pause", { detail: 1000 }));
</script>
```

> **It needs child content to start.** The tick loop starts when its
> internal `<slot>` receives content, so an empty
> `<internal-timer></internal-timer>` never ticks and reports no error.
> Any text or element works. The child isn't displayed.

## Attributes

| Attribute | Description |
|---|---|
| `fps` | Ticks per second. Must divide 120 and be at most 60 (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60), or the loop throws. Read when the content changes |

## Events

| Event | Direction | Description |
|---|---|---|
| `tick` | dispatched, bubbles | Once per period |
| `paused` | dispatched | When the loop actually stops |
| `pause` | **listened for** | Stops the loop. With a numeric `detail` (milliseconds), restarts after that long. Without one, stays stopped until the element is reconnected or its content changes |

Disconnecting the element stops the loop, and reconnecting it restarts it.
