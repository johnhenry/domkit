// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Wraps its children in a different element depending on media queries:
 * the same items in a `<ul>` on small screens and an `<ol>` on large ones. */
export default class QueryContainer extends HTMLElement {
  setInitial(selector: unknown): void;
  setQueries(queries: unknown): void;
  triggerQuery(): void;
  update(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "query-container": QueryContainer;
  }
}
