# Define Component By Content

Defines a new custom element whose markup comes from an HTML string given
directly as an attribute, rather than from a separate module file (compare
[define-component.component](../define-component.component/readme.md),
which loads markup/behavior from a URL instead).

Built on [simple-element](../simple-element/readme.md)'s
`constructSuperclass`.

## Attributes

| Attribute | Description |
|---|---|
| `name` | Tag name to register (required) |
| `content` | HTML string to render |
| `use-dom` | If present, `content` renders as light DOM (`append`ed directly); if absent (default), `content` renders inside an open shadow root |
| `mode` | Shadow root mode when `use-dom` is absent. Defaults to `"open"` |

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/define-component-by-content.component/global.mjs"
></script>
<define-component-by-content
  name="my-greeting"
  content="<p>Hello!</p>"
></define-component-by-content>
<my-greeting></my-greeting>
```
