# mounts

Using `<body>` or one of its direct children as the element an app
renders into is the usual pattern in [Solid](https://www.solidjs.com/),
[Vue](https://vuejs.org/), [React](https://react.dev/), and others.
`mounts` turns "find or create that element" into an import. Part of
[hydratable](../readme.md).

> **These modules do their work at import time.** `first.mjs` and
> `last.mjs` read (and may modify) `document.body` as soon as they're
> imported, so import them only after `<body>` exists: from a module
> script, or a script at the end of `<body>`. That's also why `mounts`
> has no `index.mjs` that bundles them.

## Usage

### Body

Use body element as a mount point.

Note: Some applications including react, warn against using the body element as a mount point.
Use 'first' or 'last' instead.

```javascript
import { render } from "solid-js/web";
import Application from "./Solid-Application";
import body from "@johnhenry/domkit/hydratable/mounts/body.mjs";
render(() => <Application />, body);
```

### First

Use body's first child as a mount point.

Creates and prepends a new 'div' element
if child is "unsuitable" or non-existent.

```javascript
import Application from "./Vue-Application";
import first from "@johnhenry/domkit/hydratable/mounts/first.mjs";
Application.mount(first);
```

### Last

Use body's last child as a mount point.

Creates and appends a new 'div' element
if child is "unsuitable" or non-existent.

```javascript
import { createRoot } from "react-dom/client";
import Application from "./React-Application";
import last from "@johnhenry/domkit/hydratable/mounts/last.mjs";
createRoot(last).render(<Application />);
```

### Unsuitable elements

The following elements are considered "unsuitable" for mounting:

- script
- style
- link
- noscript

Whitespace-only text nodes and comments are also skipped over when looking
for body's first/last *meaningful* child -- without this, `first`/`last`
would almost never actually reuse anything in a normally-formatted HTML
document (the newline + indentation right after `<body>`, or right before
`</body>`, is a real text-node child, and is virtually universal), and
would silently create a new div every time instead. 

### Unmounting

`first`/`last`'s default exports are one-shot snapshots resolved once, at
import time -- reusing an existing suitable child if there is one, or
creating and inserting a fresh `<div>` if there isn't. There was previously
no way to remove a mount point `first`/`last` created for you. `unmount()`
does that -- but only for elements it actually created; an existing element
that was found and reused is left alone, since mounts doesn't own it:

```javascript
import first from "@johnhenry/domkit/hydratable/mounts/first.mjs";
import unmount from "@johnhenry/domkit/hydratable/mounts/unmount.mjs";

// ...later, tearing the app down:
unmount(first); // true if it was a mounts-created div and got removed
```

### Resolving fresh instead of once

`first.mjs`/`last.mjs` also export named `resolveFirst()`/`resolveLast()`
functions that re-run the same find-or-create logic on demand, instead of
only ever returning the value from whenever the module first loaded:

```javascript
import { resolveFirst } from "@johnhenry/domkit/hydratable/mounts/first.mjs";
const target = resolveFirst(); // a fresh read of body's current first child
```

## See also

- [hydratable](../readme.md) — a generic hydration mixin
