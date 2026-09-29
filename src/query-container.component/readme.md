# Query Container HTML Component

Containter that changes based on a given media query

Inspired by: https://github.com/tabvengers/spicy-sections

## Example usage Usage

Single query:

This following will produce an ordered list
with class name 'ordered' and blue text
when the window's width is between 400px and 900px.

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/define-component.component/global.mjs"
></script>
<define-component name="query-component" src="./index.mjs"></define-component>
<query-component
  default="ul"
  query="
    [(min-width:300px) and (max-width:1200px)] ol.ordered[style=color:blue];
    [(min-width:400px) and (max-width:600px)] ol.ordered[style=color:red];
    "
>
  <li>a</li>
  <li>b</li>
  <li>c</li>
</query-component>
```
