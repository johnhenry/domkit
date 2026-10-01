// <define-component-by-content name="x-callout">: register a markup-only
// custom element from HTML written right there -- a <template> child (or a
// `content` attribute). Every instance renders that markup, in a shadow
// root by default, so <slot>s and scoped <style>s work.
//
//   <define-component-by-content name="x-callout">
//     <template>
//       <style>:host { display: block; border-left: 4px solid; padding: 0 1em }</style>
//       <slot></slot>
//     </template>
//   </define-component-by-content>
//   <x-callout>Heads up!</x-callout>

const MODES = ["open", "closed", "none"];

/**
 * Registers a markup-only custom element whose content comes from a
 * `<template>` child (or a `content` attribute).
 *
 * @tag define-component-by-content
 * @summary Register a markup-only custom element from inline HTML.
 *
 * @attr {string} name - The tag name to register.
 * @attr {string} content - The markup, if there's no `<template>` child.
 * @attr {string} mode - `open` (default) or `closed` shadow root, or `none` to append the markup as light DOM.
 *
 * @fires load - The element is registered (or the name already was).
 * @fires error - Missing/invalid name or mode. An `ErrorEvent`.
 */
export default class DefineComponentByContent extends HTMLElement {
  #done = false;

  connectedCallback() {
    if (this.#done) return;
    this.#done = true;
    try {
      this.#define();
      queueMicrotask(() => this.dispatchEvent(new Event("load")));
    } catch (error) {
      queueMicrotask(() =>
        this.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) })),
      );
    }
  }

  #define() {
    const name = this.getAttribute("name") ?? "";
    if (customElements.get(name)) return;
    const mode = this.getAttribute("mode") ?? "open";
    if (!MODES.includes(mode)) throw new TypeError(`mode must be one of ${MODES.join(", ")}`);
    // Capture the markup now; later edits to this element don't redefine.
    const template = document.createElement("template");
    const authored = this.querySelector(":scope > template");
    if (authored) template.content.append(authored.content.cloneNode(true));
    else template.innerHTML = this.getAttribute("content") ?? "";

    customElements.define(
      name,
      class extends HTMLElement {
        #filled = false;
        constructor() {
          super();
          if (mode !== "none") this.attachShadow({ mode }).append(template.content.cloneNode(true));
        }
        connectedCallback() {
          if (mode === "none" && !this.#filled) {
            this.#filled = true;
            this.append(template.content.cloneNode(true));
          }
        }
      },
    );
  }
}
