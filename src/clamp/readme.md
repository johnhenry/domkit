# Clamp

A curried numeric clamp: restricts a value to the `[min, max]` range.

## Usage

```javascript
import clamp from "./index.mjs";

const clampToPercent = clamp(0, 100);
clampToPercent(150); // 100
clampToPercent(-10); // 0
clampToPercent(42); // 42
```
