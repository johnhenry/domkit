# Internal Timer

A frame-rate-driven ticking element: while connected, dispatches a
bubbling `tick` event every frame (paced to the `fps` attribute, default
`60`) until paused. Dispatch a `pause` event at it to pause — with a
`detail` (milliseconds), it auto-resumes after that delay; without one,
it stays paused until you dispatch `pause` again or it reconnects.
Dispatches a non-bubbling `paused` event when it stops.

No `global.mjs` yet — register the tag name yourself:

```javascript
import InternalTimer from "../../internal-timer.component/index.mjs";
customElements.define("internal-timer", InternalTimer);
```

## Usage

```html
<internal-timer fps="30" id="clock"></internal-timer>
<script type="module">
  document.getElementById("clock").addEventListener("tick", () => {
    console.log("tick");
  });
</script>
```
