# xy-grapher

> Experimental. See [experimental](../readme.md) for what that means.

A scatter plot that's mostly CSS: give it a point *template* as its
first child and some data, and it places one copy of the template per
data point, positioned with percentages.

```js
import defineXyGrapher from "@johnhenry/domkit/experimental/xy-grapher/define.mjs";
defineXyGrapher("xy-grapher"); // or any tag name

// or: import XyGrapher from "@johnhenry/domkit/experimental/xy-grapher";
```

```html
<style>
  xy-grapher { width: 200px; height: 200px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: teal; }
</style>
<xy-grapher xmax="10" ymax="10" data='[[1, 2], {"x": 5, "y": 3, "title": "five"}]'>
  <div class="dot"></div>
</xy-grapher>
```

## Attributes and properties

| Name | Description |
|---|---|
| `data` | JSON array of points: `[x, y]` pairs, or `{ x, y, ...attributes }` objects whose other keys become attributes on that point's copy |
| `xmax`, `ymax` | The data values at the right/top edge. Default `100` |
| `transform` (property) | A function mapping each data item before plotting. Setting it re-renders |

Points are absolutely positioned (`left`/`bottom` as a percentage of
`xmax`/`ymax`) and centered on their coordinates. They're in the light
DOM, so page CSS styles them. The template child itself is hidden. There
are no axes, labels, or scales: draw those with CSS around the element.

`demo.html` plots fixed points and a 41-point sine wave.
