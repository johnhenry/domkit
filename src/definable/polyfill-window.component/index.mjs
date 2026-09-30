import { resolveRelativeUrl } from "../resolve-relative-url.mjs";

const define = async (src, name, imp, force, noImport) => {
  const url = resolveRelativeUrl(src);
  if (!globalThis[name] || force !== null) {
    const module = await import(url.href);
    if (!noImport) {
      const E = module[imp ?? "default"];
      globalThis[name] = E;
    }
  }
};

export default class extends globalThis.HTMLElement {
  #name = "";
  #src = "";
  #import = null;
  #force = false;
  #noImport = false;
  constructor() {
    super();
  }
  connectedCallback() {
    this.#name = this.getAttribute("name");
    this.#src = this.getAttribute("src");
    this.#import = this.getAttribute("import");
    this.#force = this.getAttribute("force");
    this.#noImport = this.getAttribute("no-import");
    define(this.#src, this.#name, this.#import, this.#force, this.#noImport);
  }
}
