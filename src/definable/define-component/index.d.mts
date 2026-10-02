// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Registers a custom element from HTML: a class exported by a module
 * (`src`), or markup written in the page (a `<template>` child or a
 * `content` attribute). Use one source, not both. Fires `load`/`error`
 * like `<script src>`. */
export default class DefineComponent extends HTMLElement {
  /** Resolves with the registered class once the element is defined; rejects
   * if it couldn't be. */
  readonly ready: Promise<CustomElementConstructor>;
}

declare global {
  interface HTMLElementTagNameMap {
    "define-component": DefineComponent;
  }
}
