// <define-component name="my-widget">: register a custom element from HTML
// alone, either from a module (`src`, plus `import` to pick the export) or
// from markup written right there (a <template> child, or a `content`
// attribute). One or the other, never both.
//
//   <define-component name="fancy-card" src="/components/fancy-card.mjs"></define-component>
//
//   <define-component name="x-callout">
//     <template>
//       <style>:host { display: block; border-left: 4px solid; padding: 0 1em }</style>
//       <slot></slot>
//     </template>
//   </define-component>
import { loadModule } from "../load-module.mjs";

const MODES = ["open", "closed", "none"];

const fail = (element, error) => {
  queueMicrotask(() =>
    element.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) })),
  );
  return Promise.reject(error);
};

// A markup-only element: every instance renders a copy of `template`, in a
// shadow root (so <slot>s and scoped <style>s work) or, with mode "none",
// appended as light DOM.
const markupElement = (template, mode) =>
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
  };

/**
 * Registers a custom element from HTML: a class exported by a module
 * (`src`), or markup written in the page (a `<template>` child or a
 * `content` attribute). Use one source, not both. Fires `load`/`error`
 * like `<script src>`.
 *
 * @tag define-component
 * @summary Register a custom element in HTML, from a module or from inline markup.
 *
 * @attr {string} name - The tag name to register.
 * @attr {string} src - URL of a module exporting the element class, resolved against the document's base URL. Not allowed with inline markup.
 * @attr {string} import - With `src`: the name of the export to register. Default `default`.
 * @attr {string} content - Inline markup, if there's no `<template>` child. Not allowed with `src`.
 * @attr {string} mode - With inline markup: `open` (default) or `closed` shadow root, or `none` to append the markup as light DOM.
 *
 * @fires load - The element is registered (or the name already was).
 * @fires error - No source or two sources, an invalid name or mode, or (with `src`) the module failed to load, lacked the export, or the export isn't a class. An `ErrorEvent`.
 */
export default class DefineComponent extends HTMLElement {
  #ready = null;

  connectedCallback() {
    this.#ready ??= this.#define();
    this.#ready.catch(() => {}); // reported through the `error` event
  }

  /**
   * Resolves with the registered class once the element is defined; rejects
   * if it couldn't be.
   * @type {Promise<CustomElementConstructor>}
   * @readonly
   */
  get ready() {
    this.#ready ??= this.#define();
    return this.#ready;
  }

  #define() {
    const name = this.getAttribute("name") ?? "";
    const template = this.querySelector(":scope > template");
    const inline = Boolean(template) || this.hasAttribute("content");
    const src = this.hasAttribute("src");
    if (src && inline) {
      return fail(this, new TypeError(`<define-component name="${name}"> takes src or inline content, not both`));
    }
    if (!src && !inline) {
      return fail(this, new TypeError(`<define-component name="${name}"> needs src, a <template> child, or content`));
    }
    const existing = customElements.get(name);
    if (existing) {
      // Already registered (perhaps by another <define-component>): nothing
      // to do, and nothing failed.
      queueMicrotask(() => this.dispatchEvent(new Event("load")));
      return Promise.resolve(existing);
    }
    if (src) {
      return loadModule(this, (exported) => {
        if (typeof exported !== "function") throw new TypeError(`The export for <${name}> isn't a class`);
        if (!customElements.get(name)) customElements.define(name, exported);
      }).then(() => customElements.get(name));
    }
    try {
      const mode = this.getAttribute("mode") ?? "open";
      if (!MODES.includes(mode)) throw new TypeError(`mode must be one of ${MODES.join(", ")}`);
      // Capture the markup now; later edits to this element don't redefine.
      const markup = document.createElement("template");
      if (template) markup.content.append(template.content.cloneNode(true));
      else markup.innerHTML = this.getAttribute("content");
      customElements.define(name, markupElement(markup, mode));
    } catch (error) {
      return fail(this, error);
    }
    queueMicrotask(() => this.dispatchEvent(new Event("load")));
    return Promise.resolve(customElements.get(name));
  }
}
