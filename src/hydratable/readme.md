# hydratable

App-bootstrap helpers, in two parts:

- **`hydratable`** (this module): a mixin that gives an object a guarded,
  async `hydrate()`, which runs once even if it's called many times, and a
  matching `dehydrate()` to undo it. Use it for lazy initialization:
  fetching data, attaching listeners, upgrading server-rendered markup.
- **[mounts](./mounts/readme.md)**: "where do I render my app?" as an
  import. It finds or creates the element at the start or end of `<body>`.

## The mixin

```javascript
import Hydratable from "@johnhenry/domkit/hydratable";

class Widget {}
Object.assign(
  Widget.prototype,
  Hydratable(async function ({ finalizer, dehydrator }) {
    this.data = await fetchData();
    finalizer(() => Object.freeze(this)); // runs once, right after hydration
    dehydrator(() => { this.data = null; }); // runs on dehydrate(), if you ever call it
  })
);

const widget = new Widget();
await widget.hydrate(); // runs the function above
await widget.hydrate(); // no-op -- already hydrated
await widget.dehydrate(); // undoes it -- clears the hydrated flag, runs the dehydrator
await widget.hydrate(); // hydrates again from scratch
```

`Hydratable(hydrate, name, dehydrateName)` -- `name` defaults to
`"hydrate"`, `dehydrateName` defaults to `` `de${name}` `` (so `"dehydrate"`
by default). Both methods throw if called directly on the returned
prototype object rather than through an instance.

`HYDRATED` and `TEARDOWN` (the symbols holding that state) are also
exported, for code that needs to check `widget[HYDRATED]` directly.
