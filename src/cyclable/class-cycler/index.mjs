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
    const storageKey = this.getAttribute("storage-key");
    // Wait until connected and fully configured: attributes set one at a
    // time (createElement + setAttribute) used to throw "key is required"
    // from the cycler the moment `global` was set before `storage-key`.
    if (global && storageKey && this.isConnected) {
      const selector = this.getAttribute("selector") || DEFAULT_SELECTOR;
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
