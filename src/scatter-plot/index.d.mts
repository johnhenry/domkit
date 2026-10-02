// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Plots data as copies of a point template, positioned by percentage, in
 * the light DOM so page CSS styles it. */
export default class ScatterPlot extends HTMLElement {
  /** The points. Setting it replots (and doesn't touch the `data`
   * attribute, so it can hold values JSON can't). */
  data: Array<[number, number] | { x: number, y: number, [attribute: string]: unknown }>;
  /** The plotted range, after defaults: `{ xMin, xMax, yMin, yMax }`. */
  readonly domain: { xMin: number, xMax: number, yMin: number, yMax: number };
  /** The point elements now plotted, in data order. */
  readonly points: Element[];
  textContent: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "scatter-plot": ScatterPlot;
  }
}
