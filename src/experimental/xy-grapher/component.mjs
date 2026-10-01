const observedattributes = ["xmax", "ymax", "data"];

// The element's first light-DOM child element is a hidden *template* for
// one point, cloned once per data item into a plotting container the
// element appends to its own light DOM -- light DOM, so page CSS (e.g.
// `.dot { ... }`) styles the points. Previously the plotting container sat
// behind a shadow root holding only a display:none <slot> (so nothing was
// ever visible), and the container itself got picked up as the point
// template by the next slotchange.
const CONTENT = "data-xy-grapher-content";
export default class extends globalThis.HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const style = globalThis.document.createElement("style");
    style.textContent = `
      :host { display: block; position: relative; }
      ::slotted(*) { display: none !important; }
      ::slotted([${CONTENT}]) { display: block !important; position: absolute; inset: 0; }
    `;
    this.slotted = globalThis.document.createElement("slot");
    this.slotted.addEventListener("slotchange", this.slotChange.bind(this));
    shadow.append(style, this.slotted);
    this.content = globalThis.document.createElement("div");
    this.content.setAttribute(CONTENT, "");
    this.xmax = 100;
    this.ymax = 100;
    this.trans = (_) => _;
    this.items = [];
    this.dot = null;
  }
  slotChange({ target }) {
    const dot = target
      .assignedElements()
      .find((element) => element !== this.content);
    this.dot = dot ? dot.cloneNode(true) : null;
    this.render();
  }
  static get observedAttributes() {
    return observedattributes;
  }
  connectedCallback() {
    if (this.content.parentNode !== this) {
      this.appendChild(this.content);
    }
    this.render();
  }
  disconnectedCallback() {
    this.unrender();
  }
  attributeChangedCallback(name, old, current) {
    if (name === "data") {
      const i = JSON.parse(current);
      if (typeof i[Symbol.iterator] !== "function") {
        throw new Error("data must be an iterator");
      }
      this.items = i;
      this.render();
    }
    if (name === "xmax") {
      this.xmax = Number(current);
      this.render();
    }
    if (name === "ymax") {
      this.ymax = Number(current);
      this.render();
    }
  }
  unrender() {
    this.content.replaceChildren();
  }
  set transform(t) {
    if (typeof t !== "function") {
      throw new Error("transform must be a function");
    }
    this.trans = t;
    this.render();
  }
  render() {
    this.unrender();
    if (!this.dot) {
      return;
    }
    for (const raw of [...this.items].map(this.trans)) {
      // [x, y] pairs are shorthand for { x, y }
      const item = Array.isArray(raw) ? { x: raw[0], y: raw[1] } : raw;
      const point = this.dot.cloneNode(true);
      point.style.position = "absolute";
      point.style.transform = "translate(-50%, 50%)";
      for (const [key, value] of Object.entries(item)) {
        if (key === "x") {
          point.style.left = `${(value / this.xmax) * 100}%`;
        } else if (key === "y") {
          point.style.bottom = `${(value / this.ymax) * 100}%`;
        } else {
          point.setAttribute(key, value);
        }
      }
      this.content.appendChild(point);
    }
  }
}
