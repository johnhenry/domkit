// Dynamically imports a module and registers its default (or named) export
// as a custom element. Adapted from polyfill-window.component/index.mjs's
// URL-resolution logic, but ends in customElements.define(...) instead of a
// global assignment -- see readme.md.
const define = async (src, name, imp, force) => {
  const { href } = globalThis.location;
  const indexQM = href.lastIndexOf("?");
  const withoutQuery = indexQM === -1 ? href : href.substring(0, indexQM);
  const indexS = withoutQuery.lastIndexOf("/");
  const dirname =
    indexS === -1 ? withoutQuery : withoutQuery.substring(0, indexS);
  const url = new URL(src, dirname + "/");
  if (globalThis.customElements.get(name) && force === null) {
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
