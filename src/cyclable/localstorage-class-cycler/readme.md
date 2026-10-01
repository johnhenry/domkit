# localstorage-class-cycler

[localstorage-cycler](../localstorage-cycler/readme.md) with a built-in
handler: whenever the value changes (including the initial load), it
removes all of the cycle's classes from the target element(s) and adds
the current one. Other classes on the targets are left alone. Part of
[cyclable](../readme.md).

## Usage

```js
import localStorageClassCycler from "@johnhenry/domkit/cyclable/localstorage-class-cycler";

const cycleDensity = localStorageClassCycler(
  document.body, // or an array of elements
  "density", // localStorage key
  "comfortable",
  "compact",
);

document.querySelector("#density").onclick = () => cycleDensity();
```

`localStorageClassCycler(targets, key, ...classes)` returns the same
function `localStorageCycler` does, with `.previous()`, `.peek()`, and
`.set(value)` attached.

An empty string is a valid value that means "no class":
`localStorageClassCycler(el, "k", "", "highlighted")` toggles one class
on and off.
