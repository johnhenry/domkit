import unsuitable from "./unsuitable.mjs";
import { created } from "./created.mjs";
import { skipInsignificant } from "./skip-insignificant.mjs";

/** Re-resolves body's first suitable child on every call, unlike the
 * default export below (a one-shot snapshot from import time). Use this
 * when you need a fresh read rather than the value from whenever this
 * module first loaded. */
export function resolveFirst() {
  let target = skipInsignificant(window.document.body.firstChild, "nextSibling");
  if (
    !target ||
    target.nodeType !== Node.ELEMENT_NODE ||
    unsuitable.includes(target.tagName.toLowerCase())
  ) {
    target = window.document.createElement("div");
    window.document.body.prepend(target);
    created.add(target);
  }
  return target;
}

// Eager snapshot, resolved once at import time -- see AGENTS.md for why
// this is intentional, and resolveFirst() above for a lazy alternative.
export default resolveFirst();
