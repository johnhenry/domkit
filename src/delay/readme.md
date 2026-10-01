# delay

`await delay(ms, value)` resolves with `value` after `ms` milliseconds,
or on the next microtask if `ms` is omitted. A promise-based `setTimeout`.
(Called `pause` before 0.0.7.)

## Usage

```javascript
import delay from "@johnhenry/domkit/delay";

await delay(1000, "done"); // resolves with "done" after ~1000ms
await delay(); // resolves on the next microtask
```
