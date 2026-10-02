// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Turns swipes on the area it wraps into invoker commands, one per
 * direction, sent to the `commandfor` element. */
export default class SwipeInput extends HTMLElement {
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  /** The element `commandfor` names. */
  readonly commandForElement: Element | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "swipe-input": SwipeInput;
  }
}
