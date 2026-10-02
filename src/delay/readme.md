# delay

`await delay(…)` waits, then resolves with an optional value: for the
next microtask, for some milliseconds (a promise-based `setTimeout`), or
for one frame period at a given frame rate (to pace a loop without
`setInterval`).

## Usage

```javascript
import delay from "@johnhenry/domkit/delay";

await delay(); // the next microtask
await delay(1000, "done"); // resolves with "done" after ~1000ms

while (running) {
  await delay({ fps: 30 }); // ~30 iterations per second
  step();
}
```

## API

`delay(wait, value)`

| `wait` | Waits for |
|---|---|
| omitted | The next microtask |
| a number | That many milliseconds |
| `{ fps }` | One frame period (`1000 / fps` ms), finishing on an animation frame |

It resolves with `value`. `fps` can be any positive number; anything else
rejects with a `RangeError`.

## Notes

- Frame pacing is by elapsed time, so it works on any display refresh
  rate. Like all `requestAnimationFrame` work, it waits while the page is
  hidden.
- [frame-timer](../frame-timer/readme.md) is the same idea as an element,
  with play/pause and steady `tick` events.
- `delay({ fps })` replaces the former `frame-delay` module.
