# Frame Delay

A `requestAnimationFrame`-driven delay, throttled to a target frame rate --
resolves once roughly `1/FPS` seconds' worth of animation frames have
elapsed. `FPS` must be a divisor of 120 and no greater than 60 (1, 2, 3, 4,
5, 6, 8, 10, 12, 15, 20, 24, 30, 40, or 60). (Renamed from
`pauseframespersecond`, which wasn't kebab-case and didn't read as an
action.)

## Usage

```javascript
import frameDelay from "./index.mjs";

while (!done) {
  await frameDelay(30); // throttle a loop to ~30fps
  // ... do one frame's worth of work ...
}
```
