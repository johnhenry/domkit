// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Imports a module and assigns its export to a global, unless the global
 * already exists. Fires `load`/`error` like `<script src>`. */
export default class PolyfillWindow extends HTMLElement {
  /** Resolves with the global's value once it's in place. */
  readonly ready: Promise<unknown>;
}

declare global {
  interface HTMLElementTagNameMap {
    "polyfill-window": PolyfillWindow;
  }
}
