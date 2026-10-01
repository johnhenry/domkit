# experimental

Sketches: working ideas that haven't had the correctness, lifecycle, and
API pass the rest of the package has. They're published so they can be
tried and built on. Expect that:

- **their APIs can change in any release**, including patch releases;
- they log nothing and validate little, and edge cases are untested;
- they register no tag names themselves. Each demo shows how to define
  them, usually with names of your choosing.

Anything here that proves useful graduates out of `experimental/` with a
real API, tests, and a CHANGELOG entry.

## The modules

| Module | What it is |
|---|---|
| [imagedata-emitter](./imagedata-emitter/readme.md) | Emits a bitmap (`ImageData`) as a bubbling `render` event once a second. The source end of the pixel pipeline |
| [pixel-shader](./pixel-shader/readme.md) | Elements that catch a `render` event, transform its pixels (`zoom`, `grid`), and pass it up. The middle of the pixel pipeline |
| [canvas-renderer](./canvas-renderer/readme.md) | Draws whatever `render` event reaches it onto a `<canvas>`. The sink end of the pixel pipeline |
| [animate-paths](./animate-paths/readme.md) | Animated SVG stroke drawing ("self-drawing" logos) from attributes |
| [xy-grapher](./xy-grapher/readme.md) | A scatter plot: positions copies of a template element from JSON data |
| [chernoff-face](./chernoff-face/readme.md) | [Chernoff faces](https://en.wikipedia.org/wiki/Chernoff_face): data shown as facial features |

## The pixel pipeline

The first three modules compose by **nesting**. Each layer listens for
`render` on itself, transforms `event.detail` (an `ImageData`), and
dispatches a new `render` on its parent:

```html
<canvas-renderer width="72" height="72">   <!-- 3. draws it -->
  <pixel-zoom value="12">                  <!-- 2. scales 6×6 → 72×72 -->
    <imagedata-emitter></imagedata-emitter><!-- 1. emits a 6×6 bitmap -->
  </pixel-zoom>
</canvas-renderer>
```

See [`canvas-renderer/demo.html`](./canvas-renderer/demo.html) for this
running live, with a `pixel-grid` stage added.
