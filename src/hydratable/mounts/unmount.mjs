import { created } from "./created.mjs";

/**
 * Removes `target` from the DOM, but only if it's a mount point that
 * first.mjs/last.mjs actually created. An existing element that was simply
 * found and reused as a mount point is left alone -- mounts doesn't own it
 * and has no business removing content that was already on the page.
 *
 * @param {Node} target
 * @returns {boolean} true if it was removed, false if left alone (either
 *   not a mounts-created element, or already removed).
 */
export default function unmount(target) {
  if (!created.has(target)) {
    return false;
  }
  target.remove();
  created.delete(target);
  return true;
}
