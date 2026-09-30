import classCycler from "../localstorage-class-cycler/index.mjs";

const DEFAULT_SELECTOR = "html";
export default class extends globalThis.HTMLButtonElement {
  updateBound = null;
  constructor() {
    super();
  }
  connectedCallback() {
    this.init();
    this.updateBound = this.update.bind(this);
    this.addEventListener("click", this.updateBound);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.updateBound);
  }
  update() {
    this.classCycler?.();
  }
  init() {
    const selectors = [];
    if (this.getAttribute("select")) {
      selectors.push(document.querySelector(this.getAttribute("select")));
    } else if (this.getAttribute("select-all")) {
      selectors.push(
        ...document.querySelectorAll(this.getAttribute("select-all"))
      );
    }
    if (
      !selectors.length &&
      this.getAttribute("select") !== "" &&
      this.getAttribute("select-all") !== ""
    ) {
      selectors.push(document.querySelector(DEFAULT_SELECTOR));
    }
    const storageKey = this.getAttribute("storage-key");
    const classes = (this.getAttribute("classes") || "").split(",");
    this.classCycler = classCycler(selectors, storageKey, ...classes);
  }
  static get observedAttributes() {
    return ["select", "storage-key", "select-all", "classes"];
  }
  attributeChangedCallback() {
    this.init();
  }
}
