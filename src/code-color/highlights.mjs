// The page-wide named highlights that domkit's highlighters share:
// `<code-color>` and `<code-editor>` both add their token ranges to these,
// so one `::highlight(domkit-<type>)` theme colors both. (Internal helper:
// not part of the public API.)

/** Whether this browser has the CSS Custom Highlight API. */
export const SUPPORTED = typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight === "function";

/**
 * The shared Highlight for each token type, registered as
 * `domkit-<type>`: one per type, holding ranges from every instance of
 * every element. Reuses any already registered under that name (another
 * caller, or another copy of this module), so they never fight. Null
 * without the Highlight API.
 * @param {readonly string[]} types
 * @returns {Record<string, Highlight> | null}
 */
export function sharedHighlights(types) {
  if (!SUPPORTED) return null;
  return Object.fromEntries(
    types.map((type) => {
      const name = `domkit-${type}`;
      let highlight = CSS.highlights.get(name);
      if (!highlight) {
        highlight = new Highlight();
        CSS.highlights.set(name, highlight);
      }
      return [type, highlight];
    }),
  );
}
