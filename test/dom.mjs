// Shared happy-dom setup: installs a real DOM (document, customElements,
// MutationObserver, matchMedia, requestAnimationFrame, ...) as globals,
// so modules under src/ run unmodified. node --test runs every test file
// in its own process, so each file gets a fresh document and a fresh
// custom-element registry.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({
  url: "http://localhost:8080/",
  width: 1024,
  height: 768,
});

/** Resolve after `ms` milliseconds (0 = next macrotask). */
export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse `html` into `document.body`, replacing what was there -- the way a
 * browser's `innerHTML` does it: the whole fragment (children, attributes)
 * is built first, and only then inserted, so custom elements see their
 * full content in connectedCallback. (happy-dom's own `innerHTML` setter
 * inserts node by node instead, connecting elements before their children
 * and later attributes exist.)
 */
export const render = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  document.body.replaceChildren(template.content);
  return document.body;
};
