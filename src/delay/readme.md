# Delay

An async delay -- resolves after a given number of milliseconds, or on the
next microtask if none is given. (Renamed from `pause`, which read like it
suspended something already running; this is a standalone sleep
primitive.)

## Usage

```javascript
import delay from "./index.mjs";

await delay(1000, "done"); // resolves with "done" after ~1000ms
await delay(); // resolves on the next microtask
```
