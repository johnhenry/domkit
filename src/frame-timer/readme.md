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

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `fps` | `fps` | Ticks per second. Default `60`. Any positive number, up to the display's refresh rate |
| `paused` | `paused` (read-only) | Whether it's paused. Reflects. Write it in markup to start paused, or add/remove it to pause/play |

Other properties: `ticks`, the number of ticks so far (settable, e.g. `0`
to reset; pausing keeps it).

## Methods and events

| | |
|---|---|
| `play()` / `pause()` | Start or resume, and pause |
| `tick` event | Once per period while playing (bubbles). Read `event.target.ticks` |
| `play` / `pause` events | The state changed, through a method or the `paused` attribute. Not fired for the initial markup state |

## Notes

- Ticks are scheduled by elapsed time, so the rate stays steady on 60Hz,
  120Hz, or any other display. If the page falls behind (say it was
  hidden), the backlog is skipped instead of firing a burst.
- Removing the element stops the clock, and putting it back resumes it
  unless it's paused.
- For a one-off wait instead of a clock, use
  [frame-delay](../frame-delay/readme.md).
