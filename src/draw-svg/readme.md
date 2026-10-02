# draw-svg

"Self-drawing" SVG: wrap an `<svg>` and its strokes draw themselves in, on
load or when scrolled into view. Use it for logos, signatures, diagrams,
and icons that reveal themselves. It's controlled like a media element,
and without JavaScript, or for visitors who prefer reduced motion, the
SVG is simply shown, already drawn.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/draw-svg/global.mjs"></script>

<draw-svg duration="1.5s" stagger="300ms" start="visible">
  <svg viewBox="0 0 100 100" role="img" aria-label="A house">
    <rect x="20" y="45" width="60" height="45" fill="none" stroke="currentColor" />
    <polyline points="12,50 50,15 88,50" fill="none" stroke="currentColor" />
  </svg>
</draw-svg>
```

## How it draws

Every shape it animates (paths, lines, polylines, polygons, circles,
ellipses, and rects, or what `select` picks) gets `pathLength="1"`
(unless it has its own) and `stroke-dasharray: 1`, so one dash covers the
whole stroke. Then its `stroke-dashoffset` animates from 1 (hidden) to 0
(drawn) with the Web Animations API. With `erase`, it continues to −1,
wiping the stroke out from its start, which loops nicely with
`iterations="infinite"`.

There are no generated `<style>` elements and no inline code, so it works
under a strict Content-Security-Policy. Removing the element cancels the
animations and puts the SVG back exactly as it was written.

| To get | Write |
|---|---|
| Shapes drawing one after another | `stagger="300ms"` |
| Drawing when it scrolls into view | `start="visible"` |
| Draw, then undraw, forever | `erase iterations="infinite"` |
| Draw back and forth | `iterations="infinite" direction="alternate"` |
| Only some shapes animated | `select=".outline"` |
| A button that replays it | `<button commandfor="logo" command="--restart">` |

## Controlling it

`play()`, `pause()`, and `restart()`, with `play`, `pause`, and `ended`
events and a reflected `paused` attribute, as on `<frame-timer>`. Write
`paused` in markup to start with the strokes hidden. Buttons can control
it with no script, using invoker commands: `--play`, `--pause`,
`--toggle`, and `--restart`.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `duration` |  | `string` | How long each shape takes to draw: `2s`, `400ms`, or milliseconds. Default `2s`. |
| `delay` |  | `string` | Wait before the first shape starts. Default `0`. |
| `stagger` |  | `string` | Extra delay for each next shape, so they draw one after another. Default `0` (together). |
| `easing` |  | `string` | A CSS easing function. Default `ease-in-out`. |
| `iterations` |  | `string` | How many times to draw: a number or `infinite`. Default `1`. |
| `direction` |  | `string` | `normal`, `reverse`, `alternate`, or `alternate-reverse`, as in CSS animations. |
| `erase` |  | `boolean` | After drawing in, keep going until the stroke has wiped itself out from its start. |
| `select` |  | `string` | Which shapes to animate, as a selector. Default: every path, line, polyline, polygon, circle, ellipse, and rect. |
| `paused` | `paused` | `boolean` | Whether it's paused. Reflects; write it in markup to start paused (strokes hidden). |
| `start` |  | `string` | `visible`: wait to play until the drawing scrolls into view. Default: play on connect. |

### Properties

| Property | Type | Description |
|---|---|---|
| `paused` (read-only) | `boolean` | Whether it's paused. |
| `shapes` (read-only) | `SVGGeometryElement[]` | The shapes being animated. |

### Methods

| Method | Description |
|---|---|
| `play()` | Start or resume drawing. |
| `pause()` | Pause where it is. |
| `restart()` | Draw again from the start (and play, unless paused). |

### Events

| Event | Description |
|---|---|
| `play` | It started or resumed. |
| `pause` | It paused. |
| `ended` | Every shape finished drawing (not for `iterations="infinite"`). Invoker commands: `--play`, `--pause`, `--toggle`, and `--restart` (`<button commandfor="logo" command="--restart">`). |

<!-- api:end -->

## Notes

- **Reduced motion:** when `prefers-reduced-motion: reduce` matches, it
  doesn't animate at all and the drawing is shown as written.
- Only strokes are animated. A filled shape stays filled throughout; to
  reveal a fill after its outline, transition `fill-opacity` on the
  `ended` event or with CSS.
- Shapes added to the SVG later join in, picking up the current position.
- `start="visible"` sets `paused` until the drawing is a quarter in view;
  `play()` starts it sooner.
- Round line caps can show a dot at the start of a hidden stroke. Use
  `stroke-linecap: butt` if that matters.
- Formerly `experimental/animate-paths`, whose `path-onclick` (inline
  code) and generated keyframes are gone. Use event listeners and the
  attributes above instead.
