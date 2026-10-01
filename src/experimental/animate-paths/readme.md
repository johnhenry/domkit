# animate-paths

> Experimental. See [experimental](../readme.md) for what that means.

"Self-drawing" SVG: wrap an `<svg>` and each of its `<path>`s gets an
animated `stroke-dashoffset`, with keyframes generated from attributes.

```js
import AnimatePaths from "@johnhenry/domkit/experimental/animate-paths";
customElements.define("animate-paths", AnimatePaths);
```

```html
<animate-paths
  animate
  stops="[-1, 0, 1]"
  intervals="[1, 1]"
  animation-duration="4s"
  animation-iteration-count="infinite"
>
  <svg viewBox="0 0 10 10"><path d="M1 1 L9 9" stroke="black" fill="none" /></svg>
</animate-paths>
```

On slot change, the element moves the first child `<svg>`'s paths into an
SVG of its own (copying the original's attributes), then removes the
original.

## Attributes

| Attribute | Description |
|---|---|
| `animate` | Present = apply the animation. Without it, only `stroke-dasharray` is set |
| `stops` | JSON array of dash offsets, as multiples of the path's length (`-1` = hidden one way, `0` = fully drawn, `1` = hidden the other way). One keyframe per stop |
| `intervals` | JSON array of relative durations *between* stops (`stops.length - 1` entries). `[1, 2]` spends twice as long on the second leg |
| `frac` | Multiplier on the measured path length. Default `1` |
| `animation-*` | Copied onto each path as CSS (`animation-duration`, `animation-iteration-count`, `animation-timing-function`, …) |
| `child-class` | Classes to add to the generated `<svg>` |
| `path-onclick` | Inline `onclick` code applied to every path |

`demo.htm` animates the "JH" logo over 30 seconds.
