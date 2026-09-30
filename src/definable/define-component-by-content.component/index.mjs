import { constructSuperclass } from "@johnhenry/domable/simple-element";

export default class extends globalThis.HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const name = this.getAttribute("name");
    const useShadow = this.getAttribute("shadow") || false;
    const shadowMode = this.getAttribute("mode") || "open";
    const content = this.getAttribute("content") || "";
    const useDom = this.getAttribute("use-dom") || "";
    // this.querySelector("slot").innerHTML = content;

    globalThis.customElements.define(
      name,
      class extends constructSuperclass({
        [useDom ? "HTML" : "shadowHTML"]: content,
        useShadow,
        shadowMode,
      }) {
        constructor() {
          super();
        }
      }
    );
  }
}
