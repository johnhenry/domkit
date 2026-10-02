// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** The features, in attribute form, with what 0 and 1 mean. */
export declare const FEATURES: Record<string, unknown>;

/** A Chernoff face: each facial feature is a number from 0 to 1 (0.5 is
 * neutral), drawn as an SVG in the light DOM. */
export default class ChernoffFace extends HTMLElement {
  /** Every feature's current value (0–1), keyed in camelCase
   * (`{ eyeSize: 0.5, smile: 0.9, … }`). Setting it writes the matching
   * attributes; keys you leave out are unchanged. */
  features: Record<string, number>;
}

declare global {
  interface HTMLElementTagNameMap {
    "chernoff-face": ChernoffFace;
  }
}
