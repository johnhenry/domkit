import genRandomToken from "./gen-random-token.mjs";
import fractionalStops from "./fractional-stops.mjs";
const injectAttributes = (fromElement, toElement, ...attributes) => {
  if (!attributes.length) {
    attributes = fromElement.getAttributeNames();
  }
  for (const attribute of attributes) {
    toElement.setAttribute(attribute, fromElement.getAttribute(attribute));
  }
};
export default class extends HTMLElement {
  #path = null;
  #svg = null;
  #style = null;
  constructor() {
    super();
    this.kids = new Set();
    this.kidsByKey = new Map();
  }
  connectedCallback() {
    this.style = "display:contents";
    this.shadow = this.shadow || this.attachShadow({ mode: "open" });
    this.slotted = this.shadow.appendChild(document.createElement("slot"));
    // this.slotted.style = "display:none";
    this.#style = this.appendChild(document.createElement("style"));
    this.#svg = this.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "svg")
    );

    injectAttributes(
      this,
      this.#svg,
      "class",
      "width",
      "height",
      "version",
      "viewBox",
      "xmlns"
    );
    this.slotChange = this.slotChange.bind(this);
    this.slotted.addEventListener("slotchange", this.slotChange);
  }
  static get observedAttributes() {
    onclick = "";
    return [
      "class",
      "width",
      "height",
      "version",
      "viewBox",
      "xmlns",
      "onclick",
      "frac",
      "stops",
      "intervals",
      "animate",
      "path-onclick",
    ];
  }
  attributeChangedCallback(name, old, current) {
    switch (name) {
      case "path-onclick":
        this.path?.setAttribute("onclick", this.onclick);
        break;
      default:
        this.#svg?.setAttribute(name, current);
        break;
    }
  }
  reset() {
    if (!this.#path || this.#path.tagName !== "PATH") {
      return;
    }
    this.#path.remove();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    injectAttributes(this.#path, path);
    this.#svg.appendChild(path);
    const length =
      (path.getTotalLength?.() || 268.402) *
      Number(this.getAttribute("frac") || "1");
    const animationName = genRandomToken("dash-");
    const animationEntries = [`animation-name: ${animationName};`];
    for (const key of this.getAttributeNames()) {
      if (!key.startsWith("animation-")) {
        continue;
      }
      animationEntries.push(key, ":", this.getAttribute(key), ";");
    }
    const numericStops = JSON.parse(this.getAttribute("stops") || "[0, 0]");
    const numericIntervals = JSON.parse(
      this.getAttribute("intervals") || "[1]"
    );
    const percentages = [...fractionalStops(...numericIntervals)].map(
      (x) => `${Math.round(x * 100)}%`
    );
    const frames = percentages
      .map(
        (percentage, index) =>
          `${percentage} {stroke-dashoffset: ${numericStops[index] * length};}`
      )
      .join(" ");
    path.setAttribute("stroke-dasharray", length);
    if (this.getAttribute("animate") !== null) {
      path.setAttribute("style", `${animationEntries.join(" ")} ${frames}`);
    }
    path.setAttribute("onclick", this.getAttribute("path-onclick"));
    this.#style.textContent = `@keyframes ${animationName} {${frames}}`;
  }
  slotChange({ target }) {
    this.#path = target
      .assignedElements()
      .find((child) => child.tagName === "PATH");

    this.reset();
  }
}
