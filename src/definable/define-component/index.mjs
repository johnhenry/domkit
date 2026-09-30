// Dynamically imports a module and registers its default (or named) export
// as a custom element. Shares its URL-resolution logic with
// polyfill-window/index.mjs, but ends in customElements.define(...)
// instead of a global assignment -- see readme.md.
import { resolveRelativeUrl } from "../resolve-relative-url.mjs";

const define = async (src, name, imp, force) => {
  const url = resolveRelativeUrl(src);
  const alreadyDefined = globalThis.customElements.get(name);
  if (alreadyDefined && force === null) {
    return;
  }
  if (alreadyDefined && force !== null) {
    // `force` cannot actually redefine a tag -- customElements.define()
    // unconditionally throws NotSupportedError if the name is already
    // registered, and there is no browser API to undo a registration.
    // Skip instead of letting that throw reach the caller uncaught; warn
    // so the gap is visible rather than silent.
    console.warn(
      `<define-component name="${name}" force>: "${name}" is already a registered custom element. ` +
        `customElements.define() cannot redefine a tag once registered -- there is no browser API for this. ` +
        `Skipping re-registration; the existing "${name}" registration is unchanged.`,
    );
    return;
  }
  const module = await import(url.href);
  const ElementClass = module[imp ?? "default"];
  globalThis.customElements.define(name, ElementClass);
};

export default class extends globalThis.HTMLElement {
  #name = "";
  #src = "";
  #import = null;
  #force = false;
  constructor() {
    super();
  }
  connectedCallback() {
    this.#name = this.getAttribute("name");
    this.#src = this.getAttribute("src");
    this.#import = this.getAttribute("import");
    this.#force = this.getAttribute("force");
    define(this.#src, this.#name, this.#import, this.#force);
  }
}
