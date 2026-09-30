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
      w3CodeColor(this);
    } finally {
      this.ready();
    }
  }
  connectedCallback() {
    this.ready();
  }
  ready() {
    this.#observer.observe(this, { childList: true });
  }
}
