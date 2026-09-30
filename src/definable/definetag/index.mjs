export default (elementClass) => (name) =>
  globalThis.customElements.define(name, elementClass);
