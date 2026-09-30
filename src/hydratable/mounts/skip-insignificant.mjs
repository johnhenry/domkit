// Whitespace-only text nodes and comments are ordinary, harmless artifacts
// of normal HTML formatting (the newline + indentation right after <body>,
// or right before </body>, is virtually universal) -- they're real DOM
// nodes, but not meaningful content. Without skipping them,
// body.firstChild/lastChild almost never actually lands on a real element
// in a normally-formatted document: it lands on the whitespace text node
// instead, which fails the nodeType check and forces first.mjs/last.mjs to
// create a new div every time, even when a perfectly reusable element sits
// right past it. This made the "reuse an existing suitable element" path
// effectively dead code in realistic documents -- found while building the
// demo, verified against a real browser's actual DOM for a normally
// formatted page.
function isInsignificant(node) {
  if (node.nodeType === Node.COMMENT_NODE) return true;
  if (node.nodeType === Node.TEXT_NODE) return !node.data.trim();
  return false;
}

/**
 * @param {Node|null} node
 * @param {"nextSibling"|"previousSibling"} direction
 * @returns {Node|null} the first node in that direction that isn't
 *   whitespace-only text or a comment (or null if the search runs out).
 */
export function skipInsignificant(node, direction) {
  while (node && isInsignificant(node)) {
    node = node[direction];
  }
  return node;
}
