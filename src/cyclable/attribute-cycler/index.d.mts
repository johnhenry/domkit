// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Cycles an attribute (a class, by default) through a fixed list of values
 * on target elements, persisted to localStorage, driven by buttons inside
 * it or invoker commands. */
export default class AttributeCycler extends HTMLElement {
  /** The values to cycle through, in order. */
  readonly values: string[];
  /** The attribute set on the targets. Mirrors the `attribute` attribute. */
  attribute: string;
  /** The current value. Setting it applies and persists it, without an event. */
  value: string;
  /** The elements whose attribute is set. */
  readonly targets: Element[];
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  storageKey: string;
  /** Move to the next value (wrapping), without an event. */
  next(): void;
  /** Move to the previous value (wrapping), without an event. */
  previous(): void;
  /** Forget the stored value and go back to the default (the `value`
   * attribute as first written, or the first value), without an event. */
  reset(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "attribute-cycler": AttributeCycler;
  }
}
