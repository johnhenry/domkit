/**
 * Curried `customElements.define`: `definetag(Class)("tag-name")`.
 * @param {CustomElementConstructor} elementClass
 * @returns {(name: string) => void}
 */
export default (elementClass) => (name) =>
  globalThis.customElements.define(name, elementClass);
