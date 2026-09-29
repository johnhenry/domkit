import clamp from "../clamp/index.mjs";
const observedattributes = [
  "eyeoffset",
  "lowerlip",
  "upperlip",
  "eyesize",
  "irissize",
  "lefteyex",
  "righteyex",
  "irisoffset",
  "eyerotation",
  "nosescale",
  "noseoffset",
];
const genSVG = ({
  eyeoffset = 0,
  lowerlip = 64,
  upperlip = 0,
  eyesize = 24,
  irissize = 4,
  irisoffset = 0,
  eyerotation = 0,
  nosescale = 1,
  noseoffset = 112,
} = {}) => {
  const lefteyex = 64 + Number(eyeoffset);
  const righteyex = 256 - lefteyex;
  const rot = (eyerotation * 180) / Math.PI;
  return `<svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <!-- head -->
      <circle cx="50%" cy="50%" r="48%" />
      <!-- nose -->
  const noseoffset = 128;
      <path d="m 0 0 l -8 48 h 16 z" transform="translate(128, ${noseoffset}) scale(${nosescale})" />
      <!-- mouth -->
      <path d="m 0 0
        a 64 ${lowerlip}  0 1 0 128 0
        a 64 ${upperlip}  0 0 0 -128 0
        z" transform="translate(64, 176)" fill="white"/>
      <!-- eyes -->
      <circle class="eye" cx="${lefteyex}" cy="64" r="${eyesize}"  />
      <circle class="iris" cx="${lefteyex}" cy="64" r="${irissize}" transform-origin="${lefteyex} 64" transform="rotate(${rot}) translate(0, ${irisoffset})" />
      <circle class="eye" cx="${righteyex}" cy="64" r="${eyesize}" />
      <circle class="iris" cx="${righteyex}" cy="64" r="${irissize}" transform-origin="${righteyex} 64" transform="rotate(${rot}) translate(0, ${irisoffset})" />
  </svg>`;
};

//https://gomakethings.com/converting-a-string-into-markup-with-vanilla-js/
const nodes = (attributes) =>
  new globalThis.DOMParser().parseFromString(genSVG(attributes), "text/html")
    .body.childNodes;

export default class extends globalThis.HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return observedattributes;
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
    this.unrender();
  }
  attributeChangedCallback() {
    this.render();
  }
  unrender() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }
  render() {
    const attributes = {};
    for (var att, i = 0, atts = this.attributes, n = atts.length; i < n; i++) {
      att = atts[i];
      attributes[att.nodeName] = att.nodeValue;
    }
    this.unrender();
    this.append(...nodes(attributes));
  }
}
