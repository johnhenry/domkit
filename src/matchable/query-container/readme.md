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

## Wrapper selectors

Each wrapper is written as a simple CSS selector and parsed with
[`parsel-js`](https://github.com/LeaVerou/parsel):

| Part | Becomes |
|---|---|
| `ol` | the tag (`template` if there's no tag at all) |
| `#id` | `id` |
| `.a.b` | classes |
| `[name=value]` | attributes, e.g. `[style=color:blue]` |

Use `template` as a wrapper to make the children inert (not rendered) for
some breakpoints.

## Notes

- Nesting works. A `query-container` can wrap others, as `demo.htm` does
  to build a `<dl>` from nested `<dt>`/`<dd>` containers on wide screens.
- Children added later are moved into the current wrapper automatically.
- When loading the raw source in a browser without a bundler or CDN, the
  bare `parsel-js` import needs an import map (see `demo.htm`).
