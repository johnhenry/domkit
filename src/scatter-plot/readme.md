# scatter-plot

A scatter plot built from a point you design. Each data point becomes a
copy of the `<template>` inside the element (or a plain dot), positioned
by percentage. Everything is in the light DOM, so ordinary CSS styles the
points, and there's no charting library: axes, labels, and gridlines are
yours to draw with CSS around it.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/scatter-plot/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/scatter-plot/index.css" />

<scatter-plot x-max="10" y-max="10" aria-label="Sales by week"
  data='[[1, 2], [3, 5], {"x": 5, "y": 8, "class": "peak", "title": "Best week"}]'>
  <template><span class="dot"></span></template>
</scatter-plot>
```

```css
.dot { inline-size: 8px; block-size: 8px; border-radius: 50%; background: teal; }
.peak { background: crimson; }
```

## Data

`data` is a JSON array of points, as an attribute or a property:

- `[x, y]` pairs, or
- `{ x, y, … }` objects, whose other keys become attributes on that point
  (`class`, `title`, `data-*`, `aria-*`, …). `true` writes an empty
  attribute; `false` and `null` skip it.

Items without numeric `x` and `y` are skipped. The `data` property
accepts any array (or iterable), replots, and leaves the attribute alone:

```js
document.querySelector("scatter-plot").data = readings.map((r) => [r.time, r.value]);
```

Bad JSON in the attribute fires an `error` event and keeps the last good
plot.

## Scale

The plotted range runs from `x-min` to `x-max` and `y-min` to `y-max`.
Each defaults to the data: the largest value for a maximum, and the
smallest value or 0, whichever is lower, for a minimum. The resolved range
is the read-only `domain` property. Each point is centered on its
coordinates, with `left`/`bottom` set as percentages, and carries
`data-x`/`data-y`.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `data` | `data` | `string` | JSON array of points: `[x, y]` pairs, or `{ x, y, … }` objects whose other keys become attributes on that point. |
| `x-min` |  | `number` | The x value at the left edge. Default: the smallest x, or 0 if that's positive. |
| `x-max` |  | `number` | The x value at the right edge. Default: the largest x. |
| `y-min` |  | `number` | The y value at the bottom edge. Default: the smallest y, or 0 if that's positive. |
| `y-max` |  | `number` | The y value at the top edge. Default: the largest y. |

### Properties

| Property | Type | Description |
|---|---|---|
| `data` | `Array<[number, number] \| { x: number, y: number, [attribute: string]: unknown }>` | The points. Setting it replots (and doesn't touch the `data` attribute, so it can hold values JSON can't). |
| `domain` (read-only) | `{ xMin: number, xMax: number, yMin: number, yMax: number }` | The plotted range, after defaults: `{ xMin, xMax, yMin, yMax }`. |
| `points` (read-only) | `Element[]` | The point elements now plotted, in data order. |

### Events

| Event | Description |
|---|---|
| `error` | The `data` attribute isn't a JSON array. An `ErrorEvent`; the previous data stays plotted. |

### CSS custom properties

| Property | Description |
|---|---|
| `--domkit-point-size` | Size of the default point (index.css). |
| `--domkit-accent` | Color of the default point (shared token; see theme.css). |

<!-- api:end -->

## Styling

| Selector | Matches |
|---|---|
| `scatter-plot [data-points]`, `::part(points)` | The layer holding the points, covering the element |
| `scatter-plot [data-point]` | The default point (when there's no `<template>`) |
| `scatter-plot [data-x="5"]` | A point by its value |

Without any CSS it's a block, 150px tall like a `<canvas>`, so points
have somewhere to go. `index.css` adds axis lines and a round default
point, sized by `--domkit-point-size` and colored with the shared
`--domkit-accent` token (see [`theme.css`](../theme.css)).

## Notes

- It's `role="img"`. Without an `aria-label` or `aria-labelledby`, it
  labels itself with a summary ("Scatter plot of 5 points, x from 0 to
  10, y from 0 to 8"), kept up to date; one you write is never replaced.
  For the actual numbers, put a table next to it (or in a `<details>`).
- A `<template>` added or replaced later replots. Edits inside an
  existing template's content can't be observed, so set `data` again
  afterwards.
- Formerly `experimental/xy-grapher`.
