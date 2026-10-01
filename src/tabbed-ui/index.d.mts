// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Tabs and panels from plain children, following the WAI-ARIA tabs
 * pattern: roles, ids, roving tabindex, and keyboard support are wired
 * onto whatever markup you write. */
export default class TabbedUI extends HTMLElement {
  /** The tab list: the child with role="tablist", else the first element child. */
  readonly tabList: Element | null;
  /** The tabs, in order. */
  readonly tabs: Element[];
  /** The panels, in order (every element child except the tab list). */
  readonly panels: Element[];
  /** Index of the selected tab. Setting it does not fire `change`. */
  selectedIndex: number;
  /** With `manual`, arrow keys move focus and Enter/Space selects. */
  manual: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "tabbed-ui": TabbedUI;
  }
}
