# frame-delay

A `requestAnimationFrame`-driven delay, throttled to a target frame rate --
resolves once roughly `1/FPS` seconds' worth of animation frames have
elapsed. `FPS` must be a divisor of 120 and no greater than 60 (1, 2, 3, 4,
5, 6, 8, 10, 12, 15, 20, 24, 30, 40, or 60). Any other value throws.
Timing assumes a 60Hz display, and it runs slower when the page is hidden
and the browser stops delivering frames. (Called `pauseframespersecond`
before 0.0.7.) [internal-timer](../internal-timer/readme.md) wraps this in
an element.

## Usage

```javascript
import frameDelay from "@johnhenry/domkit/frame-delay";

while (!done) {
  await frameDelay(30); // throttle a loop to ~30fps
  // ... do one frame's worth of work ...
}
```
