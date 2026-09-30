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
  #svg = null;
  #style = null;
  constructor() {
    super();
    this.kids = new Set();
    this.kidsByKey = new Map();
  }
  connectedCallback() {
    this.style = "display:contents";
    this.#svg = this.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "svg")
    );
    this.#style = this.appendChild(document.createElement("style"));
    this.shadow = this.shadow || this.attachShadow({ mode: "open" });
    this.slotted = this.shadow.appendChild(document.createElement("slot"));
    this.slotted.style = "display:none";
    this.slotChange = this.slotChange.bind(this);
    this.slotted.addEventListener("slotchange", this.slotChange);
  }
  static get observedAttributes() {
    onclick = "";
    return [
      "path-onclick",
      "frac",
      "stops",
      "intervals",
      "animate",
      "path-onclick",
      "child-class",
    ];
  }
  attributeChangedCallback(name, old, current) {
    switch (name) {
      case "path-onclick":
        const paths = this.#svg?.getElementsByTagName("path") || [];
        for (const path of paths) {
          path.setAttribute("onclick", current);
        }
        return;
    }
    this.reset();
  }
  reset() {
    if (!this.child) {
      return;
    }
    injectAttributes(this.child, this.#svg);
    const childClass = this.getAttribute("child-class");
    if (childClass) {
      this.#svg.classList.add(...childClass.split(" "));
    }
    const paths = this.child.getElementsByTagName("path") || [];
    const styles = [];
    for (const path of paths) {
      this.child.removeChild(path);
      this.#svg.appendChild(path);
      const animationName = genRandomToken("dash-");
      const length =
        (path.getTotalLength?.() || 268.402) *
        Number(this.getAttribute("frac") || "1");
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
            `${percentage} {stroke-dashoffset: ${
              numericStops[index] * length
            };}`
        )
        .join(" ");
      path.setAttribute("onclick", this.getAttribute("path-onclick"));
      path.setAttribute("stroke-dasharray", length);
      if (this.getAttribute("animate") !== null) {
        path.setAttribute("style", `${animationEntries.join(" ")} ${frames}`);
      }
      styles.push(`@keyframes ${animationName} {${frames}}`);
    }
    if (this.#style) {
      this.#style.textContent = styles.join("\n");
    }
    this.child.remove();
    this.slotted.style = "";
  }
  slotChange({ target }) {
    this.child = target
      .assignedElements()
      .find(
        (element) =>
          element.tagName.toUpperCase() === "SVG" && element !== this.#svg
      );
    this.reset();
  }
}
