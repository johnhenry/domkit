export default (elementClass) => (name) =>
  globalThis.customElements.define(name, elementClass);

// export default (elementClass) => (name) => {
//   try {
//     globalThis.customElements.define(name, elementClass);
//   } catch (e) {
//     console.error(e);
//   } finally {
//     console.log({ elementClass });
//     console.log({ name });
//   }
// };
