export default class extends HTMLElement {
  connectedCallback() {
    this.textContent = "Hello from a dynamically defined component!";
  }
}
