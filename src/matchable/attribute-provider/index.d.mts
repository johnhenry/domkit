// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Applies classes, inline styles, and attributes to its direct children
 * while media queries match, restoring what was there when they stop. */
export default class AttributeProvider extends HTMLElement {
  /** The media (or container) queries that currently match, across
   * `classes`, `styles`, and `attributes`, without duplicates. */
  readonly activeQueries: string[];
}

declare global {
  interface HTMLElementTagNameMap {
    "attribute-provider": AttributeProvider;
  }
}
