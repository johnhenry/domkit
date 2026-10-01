// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Imports a module and registers its export as a custom element. Fires
 * `load`/`error` like `<script src>`. */
export default class DefineComponent extends HTMLElement {
  /** Resolves with the registered class once the element is defined; rejects
   * if it couldn't be. */
  readonly ready: Promise<CustomElementConstructor>;
}

declare global {
  interface HTMLElementTagNameMap {
    "define-component": DefineComponent;
  }
}
