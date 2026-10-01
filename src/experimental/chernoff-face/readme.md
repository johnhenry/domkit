# chernoff-face

> Experimental. See [experimental](../readme.md) for what that means.

Renders a [Chernoff face](https://en.wikipedia.org/wiki/Chernoff_face): a
cartoon face whose features (eye size, iris direction, mouth shape, nose
position) are each driven by one attribute, so a row of faces shows
several variables of a data set at once.

```js
import defineChernoffFace from "@johnhenry/domkit/experimental/chernoff-face/define.mjs";
defineChernoffFace("chernoff-face");
```

```html
<style>
  chernoff-face > svg { width: 64px; fill: yellow; stroke: black; }
  chernoff-face .eye { fill: white; }
  chernoff-face .iris { fill: black; }
</style>
<chernoff-face irisoffset="-12"></chernoff-face>
<chernoff-face upperlip="32" lowerlip="32" noseoffset="64"></chernoff-face>
```

## Attributes

All numeric. The SVG's coordinate space is 256×256.

| Attribute | Default | Feature |
|---|---|---|
| `eyeoffset` | `0` | Horizontal spacing of the eyes |
| `eyesize` | `24` | Eye radius |
| `irissize` | `4` | Iris radius |
| `irisoffset` | `0` | Iris vertical offset (look up/down) |
| `eyerotation` | `0` | Rotation of the irises around the eye centers, in radians |
| `upperlip`, `lowerlip` | `0`, `64` | Curvature of the mouth's top and bottom |
| `nosescale` | `1` | Nose size |
| `noseoffset` | `112` | Nose vertical position |

The face re-renders on every attribute change. Style it with CSS on the
generated `svg`, `.eye`, and `.iris`. `graph.html` plots faces with
random features along a curve, as points of a scatter plot.
