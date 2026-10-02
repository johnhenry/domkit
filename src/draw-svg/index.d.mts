// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Animates the strokes of the SVG inside it so they draw themselves in,
 * with a media-element-style API. */
export default class DrawSvg extends HTMLElement {
  /** Whether it's paused. */
  readonly paused: boolean;
  /** The shapes being animated. */
  readonly shapes: SVGGeometryElement[];
  /** Start or resume drawing. */
  play(): void;
  /** Pause where it is. */
  pause(): void;
  /** Draw again from the start (and play, unless paused). */
  restart(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "draw-svg": DrawSvg;
  }
}
