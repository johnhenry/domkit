// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Wraps its children in a different element depending on media queries:
 * the same items in a `<ul>` on small screens and an `<ol>` on large ones. */
export default class QueryContainer extends HTMLElement {
  /** Mirrors the `default` attribute. */
  default: string;
  /** Mirrors the `query` attribute. */
  query: string;
  /** The media (or container) queries that currently match, in the order
   * they're written. */
  readonly activeQueries: string[];
  /** The element currently wrapping the children. */
  readonly wrapper: Element | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "query-container": QueryContainer;
  }
}
