import DefineComponent from "./index.mjs";
globalThis.customElements.define("hotkey-modal", DefineComponent, {
  extends: "dialog",
});
