// <chernoff-face>: a Chernoff face (https://en.wikipedia.org/wiki/Chernoff_face).
// Each facial feature is one number from 0 to 1 (0.5 is neutral), so you
// map a data set's variables straight onto features and read a row of
// faces at a glance. The SVG lives in the light DOM and is updated in
// place. See readme.md.
//
//   <chernoff-face smile="0.9" eye-size="0.7" aria-label="Q3: great"></chernoff-face>

const SVG = "http://www.w3.org/2000/svg";

/** The features, in attribute form, with what 0 and 1 mean. */
export const FEATURES = {
  "face-width": "narrow → wide face",
  "eye-size": "small → large eyes",
  "eye-spacing": "close → far-apart eyes",
  "pupil-size": "small → large pupils",
  gaze: "looking left → right",
  "brow-slant": "angry → worried brows",
  "nose-length": "short → long nose",
  "mouth-width": "narrow → wide mouth",
  smile: "frown → smile",
  "mouth-open": "closed → open mouth",
};
const NAMES = Object.keys(FEATURES);
const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const lerp = (from, to, t) => from + (to - from) * t;

const make = (name, attributes = {}) => {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
};

/**
 * A Chernoff face: each facial feature is a number from 0 to 1 (0.5 is
 * neutral), drawn as an SVG in the light DOM.
 *
 * @tag chernoff-face
 * @summary A face whose features show data: each is a number from 0 to 1.
 *
 * @attr {number} face-width - 0 narrow … 1 wide. Default 0.5, like every feature.
 * @attr {number} eye-size - 0 small … 1 large eyes.
 * @attr {number} eye-spacing - 0 close … 1 far-apart eyes.
 * @attr {number} pupil-size - 0 small … 1 large pupils.
 * @attr {number} gaze - 0 looking left … 1 looking right.
 * @attr {number} brow-slant - 0 angry … 1 worried brows.
 * @attr {number} nose-length - 0 short … 1 long nose.
 * @attr {number} mouth-width - 0 narrow … 1 wide mouth.
 * @attr {number} smile - 0 frown … 1 smile.
 * @attr {number} mouth-open - 0 closed … 1 open mouth.
 *
 * @cssprop --domkit-face-fill - Fill of the face (index.css).
 * @cssprop --domkit-face-stroke - Line color (index.css; defaults to currentColor).
 */
export default class ChernoffFace extends HTMLElement {
  static observedAttributes = NAMES;

  #svg = null;
  #parts = null;
  #generatedLabel = null;

  constructor() {
    super();
    // Host defaults only: an inline block the size of a large emoji.
    // Page CSS overrides them; `hidden` still hides it.
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.append(":host(:not([hidden])) { display: inline-block; inline-size: 4em; block-size: 4em; vertical-align: middle; }");
    shadow.append(style, document.createElement("slot"));
  }

  connectedCallback() {
    if (!this.#svg) this.#build();
    if (this.#svg.parentNode !== this) this.append(this.#svg);
    if (!this.hasAttribute("role")) this.setAttribute("role", "img");
    this.#draw();
  }

  attributeChangedCallback() {
    if (this.#svg) this.#draw();
  }

  /**
   * Every feature's current value (0–1), keyed in camelCase
   * (`{ eyeSize: 0.5, smile: 0.9, … }`). Setting it writes the matching
   * attributes; keys you leave out are unchanged.
   * @type {Record<string, number>}
   */
  get features() {
    return Object.fromEntries(NAMES.map((name) => [camel(name), this.#value(name)]));
  }
  set features(values) {
    for (const name of NAMES) {
      const value = values?.[camel(name)] ?? values?.[name];
      if (value !== undefined) this.setAttribute(name, String(value));
    }
  }

  // A feature's value: the attribute as a number, clamped to 0–1, or 0.5.
  #value(name) {
    const raw = this.getAttribute(name);
    const number = raw === null || raw.trim() === "" ? NaN : Number(raw);
    return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0.5;
  }

  #build() {
    this.#svg = make("svg", {
      viewBox: "0 0 256 256",
      width: "100%",
      height: "100%",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    });
    const p = {
      face: make("ellipse", { class: "face", cx: 128, cy: 128 }),
      eyes: [0, 1].map(() => make("ellipse", { class: "eye" })),
      pupils: [0, 1].map(() => make("circle", { class: "pupil", fill: "currentColor", stroke: "none" })),
      brows: [0, 1].map(() => make("line", { class: "brow" })),
      nose: make("path", { class: "nose" }),
      mouth: make("path", { class: "mouth" }),
    };
    this.#svg.append(p.face, ...p.eyes, ...p.pupils, ...p.brows, p.nose, p.mouth);
    this.#parts = p;
  }

  #draw() {
    const v = Object.fromEntries(NAMES.map((name) => [name, this.#value(name)]));
    const p = this.#parts;
    const set = (element, attributes) => {
      for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(Math.round(value * 100) / 100));
    };
    const rx = lerp(84, 120, v["face-width"]);
    set(p.face, { rx, ry: 120 });
    const eyeR = lerp(10, 26, v["eye-size"]);
    const spread = lerp(26, Math.min(62, rx - eyeR - 8), v["eye-spacing"]);
    const pupilR = lerp(3, eyeR * 0.75, v["pupil-size"]);
    const gaze = lerp(-1, 1, v.gaze) * (eyeR - pupilR);
    const slant = lerp(-14, 14, v["brow-slant"]); // inner-end height change
    [-1, 1].forEach((side, i) => {
      const cx = 128 + side * spread;
      set(p.eyes[i], { cx, cy: 100, rx: eyeR, ry: eyeR * 0.8 });
      set(p.pupils[i], { cx: cx + gaze, cy: 100, r: pupilR });
      const browY = 100 - eyeR - 14;
      const inner = cx - side * eyeR;
      const outer = cx + side * eyeR;
      set(p.brows[i], { x1: inner, y1: browY - slant, x2: outer, y2: browY + slant * 0.4 });
    });
    const noseEnd = lerp(126, 162, v["nose-length"]);
    p.nose.setAttribute("d", `M 128 112 L 118 ${Math.round(noseEnd)} L 136 ${Math.round(noseEnd)}`);
    const halfWidth = lerp(24, Math.min(64, rx - 20), v["mouth-width"]);
    const mouthY = 192;
    const curve = lerp(-26, 26, v.smile); // + bends down at the middle: a smile
    const open = lerp(0, 34, v["mouth-open"]);
    const left = 128 - halfWidth;
    const right = 128 + halfWidth;
    const upper = `M ${left} ${mouthY} Q 128 ${mouthY + curve * 2} ${right} ${mouthY}`;
    p.mouth.setAttribute(
      "d",
      open > 0.5 ? `${upper} Q 128 ${mouthY + curve * 2 + open * 2} ${left} ${mouthY} Z` : upper,
    );
    p.mouth.toggleAttribute("data-open", open > 0.5);
    this.#label(v);
  }

  // A text alternative, unless the author has written one.
  #label(values) {
    const authored =
      this.hasAttribute("aria-labelledby") ||
      (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.#generatedLabel);
    if (authored) return;
    const notable = NAMES.filter((name) => values[name] !== 0.5).map((name) => `${name.replace(/-/g, " ")} ${values[name]}`);
    this.#generatedLabel = notable.length ? `Face: ${notable.join(", ")}` : "Face, every feature neutral";
    this.setAttribute("aria-label", this.#generatedLabel);
  }
}
