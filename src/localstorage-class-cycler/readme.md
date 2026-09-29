# LocalStorage Cycler

Cycle local storage values through a given list of strings.
Renders cycled value as class on given element.

## Usage

```javascript
import classStorageCycler from "..";
const updateBodyClass = classStorageCycler(
  document.body,
  "my-key",
  "a",
  "b",
  "c"
);
updateBodyClass();
```
