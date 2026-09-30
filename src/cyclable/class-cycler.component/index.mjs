import classCycler from "../localstorage-class-cycler/index.mjs";
const DEFAULT_SELECTOR = "body";
export default class extends globalThis.HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.reset();
  }
  reset() {
    const global = this.getAttribute("global");
    if (global) {
      const selector = this.getAttribute("selector") || DEFAULT_SELECTOR;
      const storageKey = this.getAttribute("storage-key");
      const classes = (this.getAttribute("classes") || "").split(",");
      globalThis[global] = classCycler(
        document.querySelector(selector),
        storageKey,
        ...classes
      );
    }
  }
  disconnectedCallback() {
    delete globalThis[this.getAttribute("global")];
  }
  static get observedAttributes() {
    return ["global", "selector", "storage-key", "classes"];
  }
  attributeChangedCallback(name, old, current) {
    switch (name) {
      case "global":
        if (old && !current) {
          delete globalThis[old];
          return;
        }
        break;
    }
    this.reset();
  }
}
