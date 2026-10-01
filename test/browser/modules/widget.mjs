export default class extends HTMLElement {
  connectedCallback() {
    this.textContent = "default export";
  }
}
export class Named extends HTMLElement {
  connectedCallback() {
    this.textContent = "named export";
  }
}
export const notAClass = 42;
