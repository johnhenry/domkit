# Attribute Provider

Applies classes, inline styles, and/or attributes to an element's
immediate children based on media queries (screen width, orientation,
etc.) — re-evaluated on every matching query change.

Compare [query-container.component](../query-container.component/readme.md),
which swaps its rendered child element entirely by media query instead of
styling the existing one.

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
  src="https://esm.sh/@johnhenry/domkit/define-component.component/global.mjs"
></script>
<define-component name="attribute-provider" src="./index.mjs"></define-component>
```

See `demo.htm` for a full working example of all three attributes.
