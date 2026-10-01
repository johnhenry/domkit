# imagedata-emitter

> Experimental. See [experimental](../readme.md) for what that means.

The source end of the [pixel pipeline](../readme.md#the-pixel-pipeline):
while connected, it dispatches a bubbling `render` event once a second
whose `detail` is an `ImageData`, currently a fixed 6×6 smiley
([`smile.mjs`](./smile.mjs)). It's a stand-in for any real pixel source
(a simulation, a webcam frame, a generative pattern).

```js
import ImagedataEmitter from "@johnhenry/domkit/experimental/imagedata-emitter";
customElements.define("imagedata-emitter", ImagedataEmitter);
```

| Event | `detail` |
|---|---|
| `render` (dispatched, bubbles) | `ImageData` |

`utilities.mjs` exports the pixel-scaling helpers that
[pixel-shader](../pixel-shader/readme.md)'s `zoom` uses: `scaleX(data,
factor)`, `scaleY(data, width, factor)`, and `scale(data, width, x, y)`,
all on raw RGBA `Uint8ClampedArray`s. `utilities.test.html` draws their
output for a visual check.

The interval is cleared on disconnect.
