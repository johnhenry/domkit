# canvas-renderer

> Experimental. See [experimental](../readme.md) for what that means.

The sink end of the [pixel pipeline](../readme.md#the-pixel-pipeline): it
appends a `<canvas>` after its children and draws every `render` event
that reaches it.

```js
import CanvasRenderer from "@johnhenry/domkit/experimental/canvas-renderer";
customElements.define("canvas-renderer", CanvasRenderer);
```

```html
<canvas-renderer width="72" height="72">
  <!-- anything that dispatches `render` events, e.g. imagedata-emitter -->
</canvas-renderer>
```

## Attributes

| Attribute | Description |
|---|---|
| `width`, `height` | Canvas size in pixels. Default `1` |
| `squares` | Switches the drawing mode (below) |
| `border-size` | In `squares` mode, an inset applied to each square, in pixels |

## Drawing modes

| Mode | `event.detail` is | Drawn with |
|---|---|---|
| default | an `ImageData` | `putImageData` at (0, 0) |
| `squares` | an iterable of `{ color, x, y, width, height }` | `fillRect`, one per square |

The element itself is `display: contents`, so only the canvas takes up
space. Attributes are read on connect, and the canvas is removed on
disconnect.

[`demo.html`](./demo.html) runs the whole pipeline: an emitter, zoom and
grid shaders, and this renderer.
