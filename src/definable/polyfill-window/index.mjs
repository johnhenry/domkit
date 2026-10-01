// <polyfill-window name="shout" src="./shout.mjs">: import a module and put
// its export on window (globalThis), from HTML alone. Skips the import if
// the global already exists -- the polyfill pattern.
import { loadModule } from "../load-module.mjs";

/**
 * Imports a module and assigns its export to a global, unless the global
 * already exists. Fires `load`/`error` like `<script src>`.
 *
 * @tag polyfill-window
 * @summary Load a module's export onto window, in HTML.
 *
 * @attr {string} name - The global to assign (`window[name]`).
 * @attr {string} src - URL of the module, resolved against the document's base URL.
 * @attr {string} import - Name of the export to assign. Default `default`.
 *
 * @fires load - The global is in place (assigned now, or already there).
 * @fires error - The module failed to load or lacked the export. An `ErrorEvent`.
 */
export default class PolyfillWindow extends HTMLElement {
  #ready = null;

  connectedCallback() {
    this.#ready ??= this.#load();
    this.#ready.catch(() => {}); // reported through the `error` event
  }

  /**
   * Resolves with the global's value once it's in place.
   * @type {Promise<unknown>}
   * @readonly
   */
  get ready() {
    this.#ready ??= this.#load();
    return this.#ready;
  }

  async #load() {
    const name = this.getAttribute("name") ?? "";
    if (!name) {
      const error = new TypeError("<polyfill-window> needs a name attribute");
      this.dispatchEvent(new ErrorEvent("error", { error, message: error.message }));
      throw error;
    }
    if (name in globalThis) {
      queueMicrotask(() => this.dispatchEvent(new Event("load")));
      return globalThis[name];
    }
    return loadModule(this, (exported) => {
      globalThis[name] = exported;
    });
  }
}
