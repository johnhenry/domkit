# localstorage-attribute-cycler

[localstorage-cycler](../localstorage-cycler/readme.md) with a built-in
handler: whenever the value changes (including the initial load), it puts
the current value on the target element(s). By default it's a class: all
of the cycle's classes are removed and the current one added, leaving
other classes alone. With `attribute`, it's that attribute's value
instead. Part of [cyclable](../readme.md).

## Usage

```js
import localStorageAttributeCycler from "@johnhenry/domkit/cyclable/localstorage-attribute-cycler";

const cycleDensity = localStorageAttributeCycler(
  document.body, // or an array of elements
  "density", // localStorage key
  ["comfortable", "compact"],
);

const cycleTheme = localStorageAttributeCycler(document.documentElement, "theme", ["light", "dark"], {
  attribute: "data-theme",
});

document.querySelector("#density").onclick = () => cycleDensity();
```

`localStorageAttributeCycler(targets, key, values, { attribute })`
returns the same function `localStorageCycler` does, with `.previous()`,
`.peek()`, and `.set(value)` attached.

An empty string is a valid value that means "none": no class, or (for
another attribute) the attribute removed.
`localStorageAttributeCycler(el, "k", ["", "highlighted"])` toggles one
class on and off.
