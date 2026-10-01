// Shared [media query] value grammar for query-container and
// attribute-provider -- a pipe (|)-delimited list of sections,
// each either "[query] value" or a bare "value" with no query (which
// always applies). This is the ONE place that grammar is parsed; both
// components used to hand-roll their own copy, which is how they ended up
// silently diverging (query-container had no bare-value fallback and threw
// on one) despite both README's claiming a shared grammar.
//
// Callers MUST reuse the returned `mql` for both state and its change listener --
// don't call matchMedia() again yourselves. Whether two matchMedia() calls
// for the same query string return the same object is unspecified (Chrome
// returns a new MediaQueryList each time), so a handler attached to one
// call's result says nothing about another's; calling it once per section
// means each parse owns exactly the objects it attached handlers to.
const BRACKET = /\[(.+?)\](.+)/; // non-greedy: a media query never contains "]"

/**
 * @param {string} raw
 * @returns {{ mql: MediaQueryList, value: string }[]}
 */
export function parseQuerySections(raw) {
  const sections = (raw || "")
    .trim()
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const section of sections) {
    let query = "";
    let value = section;
    const match = BRACKET.exec(section);
    if (match) {
      [, query, value] = match;
      query = query.trim();
      value = value.trim();
    }
    results.push({ mql: globalThis.matchMedia(query), value });
  }
  return results;
}
