# query-container

Wraps its children in a different element depending on media queries: the
same `<li>`s inside a `<ul>` on small screens and an `<ol>` on large ones,
or the same terms inside `<dt>`/`<dd>` only when there's room for a
definition list. The children are moved, not copied, each time the
matching query changes. Inspired by
[spicy-sections](https://github.com/tabvengers/spicy-sections).

Part of [matchable](../readme.md), which describes the shared query
grammar.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/matchable/query-container/global.mjs"
></script>

<query-container
  default="ul"
  query="
    [(min-width: 600px) and (max-width: 900px)] ol.ordered |
    [(min-width: 900px)] ol.ordered[style=color:blue]
  "
>
  <li>a</li>
  <li>b</li>
  <li>c</li>
</query-container>
```

Between 600px and 900px wide the items are in `<ol class="ordered">`.
From 900px they're in a blue `<ol>`, and below 600px in a plain `<ul>`.

## Container mode

Add a `container` attribute to evaluate the queries against an element's
size instead of the viewport, like CSS container queries:

```html
<aside style="width: 18rem">
  <query-container container default="ul" query="[(min-width: 400px)] ol">
    <li>…</li>
  </query-container>
</aside>
```

- `container` (empty) measures the **parent element**, and
  `container="selector"` measures the **closest ancestor** matching the
  selector (e.g. `container=".card"`).
- The queries use the same grammar: `min-`/`max-` width and height (or
  `inline-size`/`block-size`), range syntax (`width >= 400px`,
  `400px <= width < 800px`), `orientation`, `aspect-ratio`, `and`/`or`/`not`
  and commas, with lengths in `px`, `em` (the container's font size), or
  `rem`. Other media features (`hover`, `prefers-*`) don't apply to a
  container and never match.
- The size is the container's content box, tracked with a
  `ResizeObserver`. Give the container a size that doesn't depend on this
  element's content (a block-level element, or a set width), as you would
  for CSS `container-type: inline-size`, or a swap could change the size
  that triggered it.
- After the element moves, the container is looked up again. If no
  container is found, only bracket-less sections apply.

## Wrapper selectors

Each wrapper is written as one compound CSS selector describing the
element to create:

| Part | Becomes |
|---|---|
| `ol` | the tag (`template` if there's no tag at all) |
| `#id` | `id` |
| `.a.b` | classes |
| `[name=value]`, `[name="quoted value"]`, `[name]` | attributes. Unquoted values run to the `]`, so `[style=color:blue;font-weight:bold]` works |

Use `template` as a wrapper to make the children inert (not rendered) for
some breakpoints.

## Reacting to changes

`activeQueries` lists the queries that currently match, and `wrapper` is the
element now wrapping the children. When the viewport (or container)
changes so that a query starts or stops matching, a `change` event
fires, like a `MediaQueryList`'s:

```js
const steps = document.querySelector("query-container");
steps.addEventListener("change", () => console.log(steps.activeQueries, steps.wrapper.localName));
```

Changing `query` or `default` (as attributes or properties) re-renders
without an event.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `default` | `default` | `string` | Wrapper when no query matches, as a simple selector (`ul`, `ol.steps`, `div#x[data-y=z]`). Defaults to the first section's. |
| `query` | `query` | `string` | `[media query] selector` sections separated by `\|`. The last matching section wins. |
| `container` |  | `string` | Container mode: evaluate the queries against an element's size instead of the viewport. Empty = the parent element; otherwise a selector for the closest matching ancestor. |

### Properties

| Property | Type | Description |
|---|---|---|
| `default` | `string` | Mirrors the `default` attribute. |
| `query` | `string` | Mirrors the `query` attribute. |
| `activeQueries` (read-only) | `string[]` | The media (or container) queries that currently match, in the order they're written. |
| `wrapper` (read-only) | `Element \| null` | The element currently wrapping the children. |

### Events

| Event | Description |
|---|---|
| `change` | A query started or stopped matching (the viewport or container changed), so `activeQueries` changed. The wrapper may have been swapped. |

<!-- api:end -->

## Notes

- Nesting works. A `query-container` can wrap others, as `demo.html` does
  to build a `<dl>` from nested `<dt>`/`<dd>` containers on wide screens.
- Children added later are moved into the current wrapper automatically.
- Combinators and pseudo-classes (`ul > li`, `:hover`) aren't
  supported: a wrapper is one element.
- **Do you need it?** To restyle the same element, use CSS `@media` or
  `@container`. `query-container` is for when the *element itself*
  should change, because the semantics differ (a list vs. numbered steps,
  a `<dl>` vs. paragraphs).
