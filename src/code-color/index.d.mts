// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Highlights the code inside it (JavaScript, CSS, or HTML) with the CSS
 * Custom Highlight API, without changing the DOM. Re-highlights as the
 * text changes. */
export default class CodeColor extends HTMLElement {
  /** The language in effect: `js`, `css`, `html`, or null if unrecognized. */
  readonly resolvedLanguage: string | null;
  language: string;
  /** The current token ranges, by type (for tests and tooling). */
  tokens(): { type: string, text: string }[];
}

declare global {
  interface HTMLElementTagNameMap {
    "code-color": CodeColor;
  }
}
