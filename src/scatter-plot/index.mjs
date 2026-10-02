// <scatter-plot>: plot data as copies of a point you design. Each point is
// a clone of the <template> child (or a plain <span>), absolutely
// positioned by percentage inside a light-DOM layer, so page CSS styles
// everything. See readme.md.
//
//   <scatter-plot x-max="10" y-max="10" aria-label="Sales by week"
//                 data='[[1, 2], [3, 5], {"x": 5, "y": 3, "class": "peak"}]'>
//     <template><span class="dot"></span></template>
//   </scatter-plot>

const NUMERIC = ["x-min", "x-max", "y-min", "y-max"];

const finite = (value) => (Number.isFinite(value) ? value : null);

/**
 * Plots data as copies of a point template, positioned by percentage, in
 * the light DOM so page CSS styles it.
 *
 * @tag scatter-plot
 * @summary A scatter plot of a point template, styled with ordinary CSS.
 *
 * @attr {string} data - JSON array of points: `[x, y]` pairs, or `{ x, y, … }` objects whose other keys become attributes on that point.
 * @attr {number} x-min - The x value at the left edge. Default: the smallest x, or 0 if that's positive.
 * @attr {number} x-max - The x value at the right edge. Default: the largest x.
 * @attr {number} y-min - The y value at the bottom edge. Default: the smallest y, or 0 if that's positive.
 * @attr {number} y-max - The y value at the top edge. Default: the largest y.
 *
 * @fires error - The `data` attribute isn't a JSON array. An `ErrorEvent`; the previous data stays plotted.
 *
 * @csspart points - The layer holding the points (`[data-points]`).
 * @cssprop --domkit-point-size - Size of the default point (index.css).
 * @cssprop --domkit-accent - Color of the default point (shared token; see theme.css).
 */
export default class ScatterPlot extends HTMLElement {
  static observedAttributes = ["data", ...NUMERIC];

  #data = [];
  #layer = null;
  #observer = new MutationObserver(() => this.#render());

  constructor() {
    super();
    // Host defaults only, like a <canvas>'s: a block with a default height,
    // positioned for its points. Any page CSS overrides them, and `hidden`
    // still hides it. Everything plotted stays in the light DOM (the slot).
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = ":host(:not([hidden])) { display: block; position: relative; block-size: 150px; } ::slotted(template) { display: none; }";
    shadow.append(style, document.createElement("slot"));
  }

  connectedCallback() {
    this.#layer ??= document.createElement("div");
    this.#layer.dataset.points = "";
    this.#layer.setAttribute("part", "points");
    this.#layer.style.cssText = "position: absolute; inset: 0;";
    if (this.#layer.parentNode !== this) this.append(this.#layer);
    if (!this.hasAttribute("role")) this.setAttribute("role", "img");
    // A <template> added or swapped replots. (Edits inside an existing
    // template's content can't be observed; set `data` again to replot.)
    this.#observer.observe(this, { childList: true });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback(name, previous, current) {
    if (name === "data") {
      try {
        const parsed = current === null ? [] : JSON.parse(current);
        if (!Array.isArray(parsed)) throw new TypeError("data must be a JSON array");
        this.#data = parsed;
      } catch (error) {
        this.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) }));
        return;
      }
    }
    if (this.isConnected) this.#render();
  }

  /**
   * The points. Setting it replots (and doesn't touch the `data`
   * attribute, so it can hold values JSON can't).
   * @type {Array<[number, number] | { x: number, y: number, [attribute: string]: unknown }>}
   */
  get data() {
    return this.#data;
  }
  set data(value) {
    this.#data = Array.isArray(value) ? value : [...(value ?? [])];
    if (this.isConnected) this.#render();
  }

  /**
   * The plotted range, after defaults: `{ xMin, xMax, yMin, yMax }`.
   * @type {{ xMin: number, xMax: number, yMin: number, yMax: number }}
   * @readonly
   */
  get domain() {
    const points = this.#points();
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const read = (name) => {
      const raw = this.getAttribute(name);
      return raw === null || raw.trim() === "" ? null : finite(Number(raw));
    };
    const low = (values) => (values.length ? Math.min(0, ...values) : 0);
    const high = (values) => (values.length ? Math.max(...values) : 1);
    const xMin = read("x-min") ?? low(xs);
    const yMin = read("y-min") ?? low(ys);
    let xMax = read("x-max") ?? high(xs);
    let yMax = read("y-max") ?? high(ys);
    if (xMax <= xMin) xMax = xMin + 1;
    if (yMax <= yMin) yMax = yMin + 1;
    return { xMin, xMax, yMin, yMax };
  }

  /**
   * The point elements now plotted, in data order.
   * @type {Element[]}
   * @readonly
   */
  get points() {
    return this.#layer ? [...this.#layer.children] : [];
  }

  // Data items as { x, y, attributes }, skipping ones without numbers.
  #points() {
    return this.#data
      .map((item) => {
        if (Array.isArray(item)) return { x: Number(item[0]), y: Number(item[1]), attributes: {} };
        if (item && typeof item === "object") {
          const { x, y, ...attributes } = item;
          return { x: Number(x), y: Number(y), attributes };
        }
        return null;
      })
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
  }

  #template() {
    const template = this.querySelector(":scope > template");
    if (template?.content.firstElementChild) return template.content.firstElementChild;
    const fallback = document.createElement("span");
    fallback.dataset.point = "";
    return fallback;
  }

  #render() {
    if (!this.#layer) return;
    this.#observer.disconnect(); // adding the layer isn't a change to react to
    const points = this.#points();
    const { xMin, xMax, yMin, yMax } = this.domain;
    const template = this.#template();
    const clones = points.map(({ x, y, attributes }) => {
      const point = template.cloneNode(true);
      for (const [name, value] of Object.entries(attributes)) {
        if (value === null || value === false) continue;
        try {
          point.setAttribute(name, value === true ? "" : String(value));
        } catch {
          // not a valid attribute name: skip it
        }
      }
      point.dataset.x = String(x);
      point.dataset.y = String(y);
      point.style.position = "absolute";
      point.style.left = `${((x - xMin) / (xMax - xMin)) * 100}%`;
      point.style.bottom = `${((y - yMin) / (yMax - yMin)) * 100}%`;
      point.style.translate = "-50% 50%";
      return point;
    });
    this.#layer.replaceChildren(...clones);
    // A text alternative, unless the author has written one.
    const authored =
      this.hasAttribute("aria-labelledby") ||
      (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.#generatedLabel);
    if (!authored) {
      this.#generatedLabel = points.length
        ? `Scatter plot of ${points.length} point${points.length === 1 ? "" : "s"}, x from ${xMin} to ${xMax}, y from ${yMin} to ${yMax}`
        : "Empty scatter plot";
      this.setAttribute("aria-label", this.#generatedLabel);
    }
    this.#observer.observe(this, { childList: true });
  }
  #generatedLabel = null;
}
