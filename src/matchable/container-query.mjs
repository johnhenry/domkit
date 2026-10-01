// Container mode for matchable: evaluate the same "[media query]" sections
// against an element's size instead of the viewport.
//
// compileQuery() turns a media-query-style string into a test over a size;
// ContainerQueryList wraps it in the MediaQueryList shape the elements
// already use (`.matches`, `.media`, "change" events), driven by one shared
// ResizeObserver, so query-container and attribute-provider need no other
// changes to support it.
//
// Supported: width/height/inline-size/block-size as `min-`/`max-` features
// or range syntax (`width >= 400px`, `400px <= width < 800px`), `orientation`,
// `aspect-ratio` (and its min/max forms), `and`, `or`, `not`, comma lists,
// and the media types `all`/`screen` (true) and `print` (false). Lengths in
// px, em (the container's font size), and rem. Anything else never matches.

const LENGTH = /^(-?\d*\.?\d+)(px|em|rem)?$/i;
const FEATURES = { width: "width", "inline-size": "width", height: "height", "block-size": "height" };

/** @typedef {{ width: number, height: number, em: number, rem: number }} ContainerSize */

const length = (text, size) => {
  const match = LENGTH.exec(text.trim());
  if (!match) return NaN;
  const value = Number(match[1]);
  const unit = (match[2] ?? "px").toLowerCase();
  if (!match[2] && value !== 0) return NaN; // unitless lengths are invalid, except 0
  return unit === "em" ? value * size.em : unit === "rem" ? value * size.rem : value;
};

const ratio = (text) => {
  const [a, b = "1"] = text.split("/").map((part) => Number(part.trim()));
  return a / b;
};

const compare = (left, operator, right) =>
  operator === "<" ? left < right
    : operator === "<=" ? left <= right
      : operator === ">" ? left > right
        : operator === ">=" ? left >= right
          : left === right;

const FLIP = { "<": ">", "<=": ">=", ">": "<", ">=": "<=", "=": "=" };

// One parenthesized condition, without its parentheses.
function condition(text) {
  const inner = text.trim();
  // range: "width >= 400px", "400px < width", "400px <= width < 800px"
  const range = /^(.+?)\s*(<=|>=|<|>|=)\s*(.+?)(?:\s*(<=|>=|<|>|=)\s*(.+))?$/.exec(inner);
  if (range && !inner.includes(":")) {
    const [, a, op1, b, op2, c] = range;
    if (op2) {
      // "400px <= width < 800px"
      const feature = FEATURES[b.trim()];
      if (!feature) return () => false;
      return (size) => compare(length(a, size), op1, size[feature]) && compare(size[feature], op2, length(c, size));
    }
    const leftFeature = FEATURES[a.trim()];
    const rightFeature = FEATURES[b.trim()];
    if (leftFeature) return (size) => compare(size[leftFeature], op1, length(b, size));
    if (rightFeature) return (size) => compare(size[rightFeature], FLIP[op1], length(a, size));
    if (a.trim() === "aspect-ratio") return (size) => compare(size.width / size.height, op1, ratio(b));
    return () => false;
  }
  const colon = inner.indexOf(":");
  if (colon < 0) {
    // boolean feature: "(width)" is true for any non-zero width
    const feature = FEATURES[inner];
    return feature ? (size) => size[feature] > 0 : () => false;
  }
  const name = inner.slice(0, colon).trim().toLowerCase();
  const value = inner.slice(colon + 1).trim().toLowerCase();
  const prefix = name.startsWith("min-") ? "min" : name.startsWith("max-") ? "max" : null;
  const base = prefix ? name.slice(4) : name;
  if (base === "orientation") {
    return (size) => (value === "portrait" ? size.height >= size.width : size.width > size.height);
  }
  if (base === "aspect-ratio") {
    const target = ratio(value);
    const op = prefix === "min" ? ">=" : prefix === "max" ? "<=" : "=";
    return (size) => compare(size.width / size.height, op, target);
  }
  const feature = FEATURES[base];
  if (!feature) return () => false;
  const op = prefix === "min" ? ">=" : prefix === "max" ? "<=" : "=";
  return (size) => compare(size[feature], op, length(value, size));
}

// Split on a keyword at the top level (outside parentheses).
function splitTop(text, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0) {
      if (separator === "," && c === ",") {
        parts.push(text.slice(start, i));
        start = i + 1;
      } else if (separator !== "," && text.slice(i).match(new RegExp(`^\\s+${separator}\\s+`, "i"))) {
        const match = text.slice(i).match(new RegExp(`^\\s+${separator}\\s+`, "i"));
        parts.push(text.slice(start, i));
        start = i + match[0].length;
        i = start - 1;
      }
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

function conjunction(text) {
  let rest = text.trim();
  let negate = false;
  if (/^not\s+/i.test(rest)) {
    negate = true;
    rest = rest.replace(/^not\s+/i, "");
  }
  rest = rest.replace(/^only\s+/i, "");
  const tests = splitTop(rest, "and").map((part) => {
    if (/^(all|screen)$/i.test(part)) return () => true;
    if (/^print$/i.test(part)) return () => false;
    const nested = /^\((.*)\)$/s.exec(part);
    if (!nested) return () => false;
    // "(a) or (b)" inside one group, or a plain condition
    const options = splitTop(nested[1], "or");
    if (options.length > 1 || /^\(/.test(nested[1].trim())) {
      const inner = options.map((option) => conjunction(option));
      return (size) => inner.some((test) => test(size));
    }
    return condition(nested[1]);
  });
  return (size) => tests.every((test) => test(size)) !== negate;
}

/**
 * Compile a media-query-style string into a test over a container's size.
 * An empty query always matches.
 * @param {string} query
 * @returns {(size: ContainerSize) => boolean}
 */
export function compileQuery(query) {
  const text = (query ?? "").trim();
  if (!text) return () => true;
  const alternatives = splitTop(text, ",").flatMap((part) => splitTop(part, "or")).map(conjunction);
  return (size) => alternatives.some((test) => test(size));
}

/** @param {Element} container */
const measure = (container, entry) => {
  const style = getComputedStyle(container);
  const width = entry
    ? entry.contentRect.width
    : container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const height = entry
    ? entry.contentRect.height
    : container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  return {
    width: Math.max(0, width || 0),
    height: Math.max(0, height || 0),
    em: parseFloat(style.fontSize) || 16,
    rem: parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
  };
};

// One ResizeObserver for every container; lists register only while they
// have listeners, so nothing is observed (or leaked) once released.
const watched = new Map(); // container -> Set<ContainerQueryList>
let observer = null;
const getObserver = () =>
  (observer ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = measure(entry.target, entry);
      for (const list of watched.get(entry.target) ?? []) list.update(size);
    }
  }));

/**
 * A MediaQueryList look-alike whose query is evaluated against `container`'s
 * content box. Fires "change" when `matches` flips.
 */
export class ContainerQueryList extends EventTarget {
  #test;
  #container;
  #matches;
  #listeners = new Set(); // like EventTarget, a repeated listener counts once
  #onchange = null;

  /**
   * @param {string} media
   * @param {Element | null} container  null means "no container": only an empty query matches
   */
  constructor(media, container) {
    super();
    this.media = media;
    this.#test = compileQuery(media);
    this.#container = container;
    this.#matches = container ? this.#test(measure(container)) : !media.trim();
  }

  get matches() {
    // Unobserved lists measure on demand so they're never stale.
    if (!this.#listeners.size && this.#container) this.#matches = this.#test(measure(this.#container));
    return this.#matches;
  }

  get onchange() {
    return this.#onchange;
  }
  set onchange(handler) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = typeof handler === "function" ? handler : null;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options);
    if (type === "change" && listener) this.#watch(() => this.#listeners.add(listener));
  }

  removeEventListener(type, listener, options) {
    super.removeEventListener(type, listener, options);
    if (type === "change" && listener) this.#watch(() => this.#listeners.delete(listener));
  }

  #watch(change) {
    const before = this.#listeners.size;
    change();
    if (!this.#container) return;
    const after = this.#listeners.size;
    if (!before && after) {
      if (!watched.has(this.#container)) {
        watched.set(this.#container, new Set());
        getObserver().observe(this.#container);
      }
      watched.get(this.#container).add(this);
      this.#matches = this.#test(measure(this.#container));
    } else if (before && !after) {
      const lists = watched.get(this.#container);
      lists?.delete(this);
      if (lists && !lists.size) {
        watched.delete(this.#container);
        getObserver().unobserve(this.#container);
      }
    }
  }

  /** @param {ContainerSize} size */
  update(size) {
    const matches = this.#test(size);
    if (matches !== this.#matches) {
      this.#matches = matches;
      const event = new Event("change");
      Object.defineProperties(event, { matches: { value: matches }, media: { value: this.media } });
      this.dispatchEvent(event);
    }
  }
}

/**
 * The container an element with a `container` attribute measures: its
 * parent for an empty value, else the closest ancestor matching the value
 * as a selector. Null if the attribute is absent.
 * @param {Element} element
 * @returns {Element | null | undefined}  undefined = viewport mode
 */
export function containerFor(element) {
  if (!element.hasAttribute("container")) return undefined;
  const selector = element.getAttribute("container").trim();
  const parent = element.parentElement;
  if (!selector) return parent;
  try {
    return parent?.closest(selector) ?? null;
  } catch {
    return null; // invalid selector
  }
}
