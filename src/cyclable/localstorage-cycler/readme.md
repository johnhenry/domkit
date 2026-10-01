# localstorage-cycler

The engine under [cyclable](../readme.md): a value that steps through a
fixed list and persists in `localStorage`, with an optional change
handler. It has no DOM dependency beyond `localStorage`.

## Usage

```js
import localStorageCycler from "@johnhenry/domkit/cyclable/localstorage-cycler";

const updateLocalStorage = localStorageCycler("my-key", "a", "b", "c");
updateLocalStorage(); // → { value: "b", key: "my-key", index: 1, result: undefined }
```

The call to "localStorageCycler"
checks for the existence
of the key ("my-key") in localStorage.
and sets it to the first key ("a") if not already set.

When called, the "updateLocalStorage" function
cycles the value associated with the key
in localStorage through the given values ("a", "b", and "c").

The "updateLocalStorage" returns an object with the following keys:

- key - the associated local storage key
- value - the current value of the local storage item
- index - the current index of the local storage item. (Known quirk, kept for compatibility: on a wrap-around, this is the out-of-range position, `values.length` going forward or `-1` going back, not the index of the value actually stored.)
- result - the result of the handler, if passed (see below)

## Change Handler

To react to the change,
pass a optional change handler
as the second parameter to "localStorageCycler".

```javascript
const onChange = ({ value, key, index, events }) =>
  console.log({ value, key, index, events });
const updateLocalStorage = localStorageCycler(
  "my-key",
  onChange,
  "a",
  "b",
  "c"
);
```

The handler receives one object with four properties:

- the same, "key", "value", and "index" parameters
  returned from calling "updateLocalStorage"

- an "events" parameter -- an array of everything
  passed into the "updateLocalStorage" function OR
  an "init" CustomEvent if fired from the initial
  call to localStorageCycler.

## `.previous()`, `.peek()`, `.set()`

The returned function is still directly callable to advance forward
(as above), and also carries three additional methods:

```javascript
updateLocalStorage.previous(); // step backward instead of forward
updateLocalStorage.peek(); // read the current { value, key, index } without changing anything
updateLocalStorage.set("b"); // jump directly to a specific value (must be one of the configured values)
```

All three return the same `{ value, key, index, result }` shape as the
main function (`peek()` omits `result` -- it doesn't call the handler).
`set()` throws if given a value that isn't one of the ones this cycler was
configured with.
