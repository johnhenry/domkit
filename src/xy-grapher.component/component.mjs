const observedattributes = ["xmax", "ymax", "data"];

//https://gomakethings.com/converting-a-string-into-markup-with-vanilla-js/
const nodes = (attributes) =>
  new globalThis.DOMParser().parseFromString(genSVG(attributes), "text/html")
    .body.childNodes;

export default class extends globalThis.HTMLElement {
  constructor() {
    super();
    this.slotted = globalThis.document.createElement("slot");
    this.slotted.style = "display:none";
    this.slotted.addEventListener("slotchange", this.slotChange.bind(this));
    const shadow = this.attachShadow({ mode: "open" });
    this.content = globalThis.document.createElement("div");
    this.content.className = "content";
    shadow.append(this.slotted);
    this.xmax = 100;
    this.ymax = 100;
    this.trans = (_) => _;
    this.items = [];
    this.dot = null;
  }
  slotChange({ target }) {
    const dot = target.assignedElements()[0];
    if (dot) {
      this.dot = dot.cloneNode(true);
    } else {
      this.dot = null;
    }
    this.render();
  }
  static get observedAttributes() {
    return observedattributes;
  }
  connectedCallback() {
    this.appendChild(this.content);
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
    // while (this.slotted.firstChild) {
    //   this.slotted.removeChild(this.firstChild);
    // }
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
    // throw new Error('');
    // console.log(this.items);
    this.items.map(this.trans).forEach((item) => {
      const i = this.dot.cloneNode(true);
      for (const [key, value] of Object.entries(item)) {
        if (key === "x") {
          i.style.left = `${(value / this.xmax) * 100}%`;
        } else if (key === "y") {
          i.style.bottom = `${(value / this.ymax) * 100}%`;
        } else {
          i.setAttribute(key, value);
        }
      }
      console.log(i);
      this.content.appendChild(i);
    });
  }
}
