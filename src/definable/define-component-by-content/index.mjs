import { constructSuperclass } from "@johnhenry/domable/simple-element";

export default class extends globalThis.HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const name = this.getAttribute("name");
    const shadowMode = this.getAttribute("mode") || "open";
    const content = this.getAttribute("content") || "";
    const useDom = this.getAttribute("use-dom") || "";

    globalThis.customElements.define(
      name,
      class extends constructSuperclass({
        [useDom ? "HTML" : "shadowHTML"]: content,
        shadowMode,
      }) {
        constructor() {
          super();
        }
      }
    );
  }
}
