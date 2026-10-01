import w3CodeColor from "./w3-code-color.mjs";
export default class extends HTMLElement {
  #observer;
  constructor() {
    super();
    this.#observer = new MutationObserver(this.observe.bind(this));
  }
  observe() {
    this.#observer.disconnect();
    try {
      // mode: "html" (default), "css", or "js" -- w3-code-color's three modes
      w3CodeColor(this, this.getAttribute("mode") || undefined);
    } finally {
      this.ready();
    }
  }
  connectedCallback() {
    // Highlight the initial content too -- previously only a later
    // childList mutation ever triggered highlighting, so static content
    // was never colored at all.
    this.observe();
  }
  disconnectedCallback() {
    this.#observer.disconnect();
  }
  ready() {
    this.#observer.observe(this, { childList: true });
  }
}
