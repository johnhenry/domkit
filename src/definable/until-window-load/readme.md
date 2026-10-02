# until-window-load

Hide content until the page is ready, to avoid a flash of unstyled or
unarranged content while custom elements load and upgrade. It removes a
class from every element that has it once `window` has fired `load` **and**
every `<define-component>` and `<polyfill-window>` on the page has
finished, so components registered from HTML exist before anything is
shown. Part of [definable](../readme.md).

## Usage

Load the global script, hide the class, and put it on whatever should
wait:

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/until-window-load/global.mjs"></script>
<script type="module" src="https://esm.sh/@johnhenry/domkit/definable/define-component/global.mjs"></script>
<style>
  .until-window-load { visibility: hidden; }
</style>

<define-component name="fancy-card" src="/components/fancy-card.mjs"></define-component>
<fancy-card class="until-window-load">Shown once fancy-card is defined</fancy-card>
```

To use your own class names, call the function instead:

```js
import untilWindowLoad from "@johnhenry/domkit/definable/until-window-load";

await untilWindowLoad("loading", "skeleton"); // resolves once both are removed
```

## API

`untilWindowLoad(...classNames)` returns a promise that resolves once the
classes have been removed. It waits for:

1. the window's `load` event, unless it has already fired;
2. the `ready` promise of every `<define-component>` and
   `<polyfill-window>` in the document at that point, whether it
   resolves or rejects. A failed load still reveals the page.

## Notes

- Only loaders already in the document when the window loads are waited
  for. One that isn't upgraded (because its script never loaded) is
  skipped instead of waited on forever.
- For a custom element you register yourself, CSS alone can do this:
  `fancy-card:not(:defined) { visibility: hidden }`.
