# attribute-provider

Applies classes, inline styles, and attributes to its **direct children**
according to media queries (width, orientation, `prefers-color-scheme`,
anything `matchMedia` accepts), and re-applies them live as the queries
change.

Part of [matchable](../readme.md), which describes the shared query
grammar. Compare [query-container](../query-container/readme.md), which
swaps the wrapping element instead of styling the children.

It only ever **adds** to what the children already have, and remembers
what it changed: when a query stops matching, its classes are removed,
and inline styles and attributes go back to their original values. The
children's own classes, styles, and attributes are never lost.

> **Do you need it?** For pure styling, CSS `@media` and `@container`
> rules are simpler. Use `attribute-provider` when the thing that should
> change isn't a style: utility classes from a CSS framework, or
> attributes like `hidden`, `disabled`, `placeholder`, or `aria-*`.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/matchable/attribute-provider/global.mjs"
></script>
```

When several sections match, all of them apply, in order. See `demo.htm`
for a working example of all three attributes.

## Query attributes

Each of `classes`/`styles`/`attributes` accepts one or more
`[media query] value` sections, pipe (`|`)-delimited. A section with no
`[media query]` prefix always applies.

### `classes`

Space-delimited class names per section. Removed when no longer matched
(unless the child had the class to begin with).

```html
<attribute-provider
  classes="
    red|
    [(min-width:512px) and (max-width:768px)] green border|
    [(orientation:portrait)] tall
  "
>
  <div></div>
</attribute-provider>
```

### `styles`

Semicolon-delimited `property: value` declarations per section
(`!important` is honored). Restored to the child's own inline value when
no longer matched.

```html
<attribute-provider
  styles="
    background-color:red|
    [(min-width:512px) and (max-width:768px)] background-color:green; border: 8px solid black
  "
>
  <div></div>
</attribute-provider>
```

### `attributes`

Semicolon-delimited `name=value` pairs per section. A bare `name` sets an
empty (boolean) attribute, values can be quoted, and `name=null` *removes*
the attribute while the query matches. When the query stops matching,
each attribute goes back to its original value (or absence).

```html
<attribute-provider
  attributes="
    [(max-width:512px)] disabled=null;hidden=null;placeholder='enabled'|
    [(min-width:512px) and (max-width:768px)] disabled;hidden=null|
    [(min-width:768px)] hidden
  "
>
  <input />
</attribute-provider>
```

## Container mode

Add a `container` attribute to evaluate the queries against an element's
size instead of the viewport, like CSS container queries:

```html
<aside style="width: 18rem">
  <attribute-provider container classes="[(max-width: 300px)] stacked">
    <div class="card">…</div>
  </attribute-provider>
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

## Reacting to changes

`activeQueries` lists the queries that currently match, across `classes`,
`styles`, and `attributes` (each query once). When the viewport (or
container) changes so that one starts or stops matching, the children
are updated and a `change` event fires:

```js
provider.addEventListener("change", () => console.log(provider.activeQueries));
```

Editing the attributes re-applies without an event.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `classes` |  | `string` | `[media query] class class \| …` sections. Bracket-less sections always apply. |
| `styles` |  | `string` | `[media query] property: value; … \| …` sections. |
| `attributes` |  | `string` | `[media query] name=value; name; name=null \| …` sections. `null` removes the attribute while the query matches. |
| `container` |  | `string` | Container mode: evaluate the queries against an element's size instead of the viewport. Empty = the parent element; otherwise a selector for the closest matching ancestor. |

### Properties

| Property | Type | Description |
|---|---|---|
| `activeQueries` (read-only) | `string[]` | The media (or container) queries that currently match, across `classes`, `styles`, and `attributes`, without duplicates. |

### Events

| Event | Description |
|---|---|
| `change` | A query started or stopped matching (the viewport or container changed), so `activeQueries` changed and the children were updated. |

<!-- api:end -->
