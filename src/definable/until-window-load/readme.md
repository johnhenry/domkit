# until-window-load

Hide content until the page has fully loaded, to avoid a flash of
unarranged content while custom elements upgrade: it removes a class from
every element that has it once `window` fires `load`, or immediately if
that has already happened. Part of [definable](../readme.md).

## Usage

### Manual

Define the class to be removed:

```js
import removeLoadingClasses from "https://esm.sh/@johnhenry/domkit/definable/until-window-load/index.mjs";
removeLoadingClasses("custom-loading-class");
```

```css
.custom-loading-class {
  visibility: hidden;
}
```

```html
<custom-component class="custom-loading-class"
  >Hide me until window load</custom-component
>
```

### Automatic

Use the "global" import to automatically use the class name `until-window-load`:

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/definable/until-window-load/global.mjs"
></script>
<style>
  .until-window-load {
    visibility: hidden;
  }
</style>
<custom-component class="until-window-load"
  >Hide me until window load</custom-component
>
```
