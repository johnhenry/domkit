# Event Consumer

A `display:contents` wrapper element for declaratively wiring event
listeners onto its children/self, without writing JavaScript setup code.
Listens for the `events` attribute's comma-delimited event names and runs
`onevent`'s function body (like inline `onclick`, but for an arbitrary
event list) on each. Stops propagation unless a `bubbles` attribute is
present.

No `global.mjs` yet — register the tag name yourself:

```javascript
import EventConsumer from "../event-consumer.component/index.mjs";
customElements.define("event-consumer", EventConsumer);
```

## Usage

```html
<event-consumer events="click,keydown" onevent="console.log(event.type)">
  <button>Click or focus+key me</button>
</event-consumer>
```
