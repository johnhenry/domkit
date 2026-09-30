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
        // Covers both "global" being removed AND being renamed to a
        // different value -- the old branch here only cleared the old
        // global when it was removed entirely, leaking a stale global
        // function under the previous name whenever `global` was renamed
        // from one non-empty value directly to another.
        if (old && old !== current) {
          delete globalThis[old];
        }
        if (!current) {
          return;
        }
        break;
    }
    this.reset();
  }
}
