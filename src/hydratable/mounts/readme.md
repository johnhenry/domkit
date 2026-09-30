# Mounts

Using the body or its direct decendents
as mount points is a common pattern
in modern javascript applications ([Solid](https://www.solidjs.com/), [Vue](https://vuejs.org/), [React](https://reactjs.org/), etc.).

We can declaratively abstract this away as imports.

## Usage

### Body

Use body element as a mount point.

Note: Some applications including react, warn against using the body element as a mount point.
Use 'first' or 'last' instead.

```javascript
import { render } from "solid-js/web";
import Application from "./Soild-Application";
import body from "mounts/body.mjs";
render(() => <Application />, body);
```

### First

Use body's first child as a mount point.

Creates and prepends a new 'div' element
if child is "unsuitable" or non-existent.

```javascript
import Application from "./Vue-Application";
import first from "mounts/first.mjs";
Application.mount(first);
```

### Last

Use body's last child as a mount point.

Creates and appends a new 'div' element
if child is "unsuitable" or non-existent.

```javascript
import { createRoot } from "react";
import Application from "./React-Application";
import last from "mounts/last.mjs";
const root = createRoot(last);
root.render(Application);
```

### Unsuitable elements

The following elements are considered "unsuitable" for mounting:

- script
- style
- link
- noscript

### Unmounting

`first`/`last`'s default exports are one-shot snapshots resolved once, at
import time -- reusing an existing suitable child if there is one, or
creating and inserting a fresh `<div>` if there isn't. There was previously
no way to remove a mount point `first`/`last` created for you. `unmount()`
does that -- but only for elements it actually created; an existing element
that was found and reused is left alone, since mounts doesn't own it:

```javascript
import first from "mounts/first.mjs";
import unmount from "mounts/unmount.mjs";

// ...later, tearing the app down:
unmount(first); // true if it was a mounts-created div and got removed
```

### Resolving fresh instead of once

`first.mjs`/`last.mjs` also export named `resolveFirst()`/`resolveLast()`
functions that re-run the same find-or-create logic on demand, instead of
only ever returning the value from whenever the module first loaded:

```javascript
import { resolveFirst } from "mounts/first.mjs";
const target = resolveFirst(); // a fresh read of body's current first child
```

## See also

- [`@johnhenry/domable`](https://github.com/johnhenry/domable)'s `domToReact`/`reactToDom` — converting between real DOM and React-element-shaped objects (domkit doesn't vendor its own copy of these; domable's is the maintained one)
- [hydratable](../hydratable/readme.md) — a generic hydration mixin
