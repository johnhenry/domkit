# frame-timer

A clock you can put in the page: while playing, it fires a `tick` event at
a steady rate (`fps`), paced by `requestAnimationFrame`, so it rests while
the page is hidden. You control it like a `<video>`, with `play()`,
`pause()`, a `paused` attribute, and `play`/`pause` events. Use it for
game loops, animations, auto-advancing slides, or simple counters, without
writing the loop yourself.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/frame-timer/global.mjs"></script>

<frame-timer id="clock" fps="30"></frame-timer>
<button onclick="clock.paused ? clock.play() : clock.pause()">Play/pause</button>
<output id="count">0</output>

<script type="module">
  clock.addEventListener("tick", () => (count.value = clock.ticks));
</script>
```

The element renders nothing. It's only a clock.

## API

<!-- api:start (generated from custom-elements.json by `npm run manifest`; edit the JSDoc instead) -->

### Attributes

| Attribute | Property | Type | Description |
|---|---|---|---|
| `paused` | `paused` | `boolean` | Whether the timer is paused. Reflects; write it in markup to start paused. |
| `fps` | `fps` | `number` | Ticks per second. Default 60. Any positive number up to the display's refresh rate. |

### Properties

| Property | Type | Description |
|---|---|---|
| `fps` | `number` | Ticks per second. |
| `paused` (read-only) | `boolean` | Whether the timer is paused. |
| `ticks` | `number` | Ticks fired since the element was created (pausing keeps the count). |

### Methods

| Method | Description |
|---|---|
| `play()` | Start or resume ticking. |
| `pause()` | Stop ticking (the count is kept). |

### Events

| Event | Description |
|---|---|
| `play` | The timer started (or resumed). |
| `pause` | The timer paused. |
| `tick` | Once per period while playing. Read `ticks` for the count. |

<!-- api:end -->

## Notes

- Ticks are scheduled by elapsed time, so the rate stays steady on 60Hz,
  120Hz, or any other display. If the page falls behind (say it was
  hidden), the backlog is skipped instead of firing a burst.
- Removing the element stops the clock, and putting it back resumes it
  unless it's paused.
- For a one-off wait instead of a clock, use
  [delay](../delay/readme.md): `await delay({ fps: 30 })`.
