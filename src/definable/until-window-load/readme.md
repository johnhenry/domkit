# Until Window Load

Declarative import to remove loading classes once the window has loaded.

Useful to avoid content flash for custom components that arrange content
after loading. Used by [polyfill-window.component](../polyfill-window.component/readme.md)'s
own demo.

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
