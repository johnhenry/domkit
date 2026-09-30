# Hydratable

Hydratable adds hydration functionality to objects in your prototype chain.

```javascript
import Hydratable from ".";

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

## See also

- [mounts](../mounts/readme.md) — framework-agnostic DOM mount-point helpers
