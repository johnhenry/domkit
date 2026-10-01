// <define-component name="my-widget" src="/components/my-widget.mjs">: import a module
// and register its export as a custom element, from HTML alone.
import { loadModule } from "../load-module.mjs";

/**
 * Imports a module and registers its export as a custom element. Fires
 * `load`/`error` like `<script src>`.
 *
 * @tag define-component
 * @summary Register a custom element from a module URL, in HTML.
 *
 * @attr {string} name - The tag name to register.
 * @attr {string} src - URL of the module, resolved against the document's base URL.
 * @attr {string} import - Name of the export to register. Default `default`.
 *
 * @fires load - The element is registered (or the name already was).
 * @fires error - The module failed to load, lacked the export, or the export isn't a class. An `ErrorEvent`.
 */
export default class DefineComponent extends HTMLElement {
  #ready = null;

  connectedCallback() {
    this.#ready ??= this.#define();
    this.#ready.catch(() => {}); // reported through the `error` event
  }

  /**
   * Resolves with the registered class once the element is defined; rejects
   * if it couldn't be.
   * @type {Promise<CustomElementConstructor>}
   * @readonly
   */
  get ready() {
    this.#ready ??= this.#define();
    return this.#ready;
  }

  async #define() {
    const name = this.getAttribute("name") ?? "";
    const existing = customElements.get(name);
    if (existing) {
      // Already registered (perhaps by another <define-component>): nothing
      // to do, and nothing failed.
      queueMicrotask(() => this.dispatchEvent(new Event("load")));
      return existing;
    }
    return loadModule(this, (exported) => {
      if (typeof exported !== "function") throw new TypeError(`The export for <${name}> isn't a class`);
      if (!customElements.get(name)) customElements.define(name, exported);
    }).then(() => customElements.get(name));
  }
}
