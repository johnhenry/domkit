# attribute-provider

Applies classes, inline styles, and attributes to its **direct children**
according to media queries (width, orientation, `prefers-color-scheme`,
anything `matchMedia` accepts), and re-applies them live as the queries
change.

Part of [matchable](../readme.md), which describes the shared query
grammar. Compare [query-container](../query-container/readme.md), which
swaps the wrapping element instead of styling the children.

> **`classes` and `styles` replace, they don't merge.** On every update,
> each child's entire `class` list is replaced by the matching sections'
> classes, and its entire `style` attribute by the matching declarations.
> Classes or inline styles written on the children in markup are lost.
> Put anything permanent in a bracket-less section, which always applies.

## Attributes

Each of `classes`/`styles`/`attributes` accepts one or more
`[media query] value` sections, pipe (`|`)-delimited. A section with no
`[media query]` prefix always applies.

### `classes`

Space-delimited class names per section. Classes reset automatically when
no longer matched.

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

Semicolon-delimited `property:value` declarations per section. Styles
reset automatically when no longer matched.

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

Semicolon-delimited `name=value` pairs per section. Use `null` (no quotes)
to remove an attribute. **Attributes do NOT reset automatically** —
unlike `classes`/`styles`, every query case must explicitly say what to do
with each attribute.

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

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/matchable/attribute-provider/global.mjs"
></script>
```

When several sections match, all of them apply, in order. See `demo.htm`
for a working example of all three attributes.
