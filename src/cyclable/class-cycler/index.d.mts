// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Cycles a class through a fixed list on target elements, persisted to
 * localStorage, driven by buttons inside it or invoker commands. */
export default class ClassCycler extends HTMLElement {
  /** The values to cycle through, in order. */
  readonly values: string[];
  /** The current value. Setting it applies and persists it, without an event. */
  value: string;
  /** The elements whose class is set. */
  readonly targets: Element[];
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  storageKey: string;
  /** Move to the next value (wrapping), without an event. */
  next(): void;
  /** Move to the previous value (wrapping), without an event. */
  previous(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "class-cycler": ClassCycler;
  }
}
