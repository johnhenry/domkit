# frame-delay

`await frameDelay(fps)` waits one frame period (`1000 / fps`
milliseconds), finishing on an animation frame. Use it to pace a loop
without `setInterval`. Like all `requestAnimationFrame` work, it waits
while the page is hidden. [frame-timer](../frame-timer/readme.md) is the
same idea as an element with play/pause.

## Usage

```javascript
import frameDelay from "@johnhenry/domkit/frame-delay";

while (running) {
  await frameDelay(30); // ~30 iterations per second
  step();
}

await frameDelay(10, "value"); // resolves with "value"
```

`fps` defaults to `60` and can be any positive number. Pacing is by
elapsed time, so it works on any display refresh rate. A non-positive
`fps` throws a `RangeError`.
