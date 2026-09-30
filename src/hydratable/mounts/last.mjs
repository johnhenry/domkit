import unsuitable from "./unsuitable.mjs";
import { created } from "./created.mjs";

/** Re-resolves body's last suitable child on every call, unlike the
 * default export below (a one-shot snapshot from import time). Use this
 * when you need a fresh read rather than the value from whenever this
 * module first loaded. */
export function resolveLast() {
  let target = window.document.body.lastChild;
  if (
    !target ||
    target.nodeType !== Node.ELEMENT_NODE ||
    unsuitable.includes(target.tagName.toLowerCase())
  ) {
    target = window.document.createElement("div");
    window.document.body.append(target);
    created.add(target);
  }
  return target;
}

// Eager snapshot, resolved once at import time -- see AGENTS.md for why
// this is intentional, and resolveLast() above for a lazy alternative.
export default resolveLast();
