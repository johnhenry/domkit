// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** A frame-paced clock: fires `tick` at a steady rate while playing, with
 * a media-element-style API. */
export default class FrameTimer extends HTMLElement {
  /** Ticks per second. */
  fps: number;
  /** Whether the timer is paused. */
  readonly paused: boolean;
  /** Ticks fired since the element was created (pausing keeps the count). */
  ticks: number;
  /** Start or resume ticking. */
  play(): void;
  /** Stop ticking (the count is kept). */
  pause(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "frame-timer": FrameTimer;
  }
}
