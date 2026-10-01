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

## Attributes

| Attribute | Description |
|---|---|
| `default` | The wrapper to use when no query matches, as a selector (below). If omitted, the first section's selector is the default |
| `query` | `[media query] selector` sections, `|`-separated. The **last** matching section wins |
| `container` | Evaluate the queries against an element's size instead of the viewport (see [Container mode](#container-mode)) |

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
