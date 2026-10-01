import { parseQuerySections } from "../query-sections.mjs";

const stripQuotes = (string, quotes = ["'", '"', "`"]) => {
  for (const quote of quotes) {
    if (string.startsWith(quote) && string.endsWith(quote)) {
      return string.slice(1, -1);
    }
  }
  return string;
};

export default class extends HTMLElement {
  #classes;
  #styles;
  #attributes;
  #observer;
  #mediaMatches;
  #handlers;
  constructor() {
    super();
    this.#observer = new globalThis.MutationObserver(this.setAll.bind(this));
    this.#mediaMatches = {};
    this.#handlers = {
      classes: () => this.triggerClass(),
      styles: () => this.triggerStyle(),
      attributes: () => this.triggerAttribute(),
    };
  }
  connectedCallback() {
    // (Re)start here, not in the constructor: disconnectedCallback stops
    // both the observer and every media-query listener, and nothing used
    // to restart them -- a moved element silently stopped responding.
    this.#observer.observe(this, { childList: true });
    this.setAll();
  }
  disconnectedCallback() {
    this.#observer.disconnect();
    for (const key of Object.keys(this.#mediaMatches)) {
      this.#release(key);
    }
  }
  // Detach the media-query listeners from a previous parse of `key` before
  // replacing them, so re-parsing (on reconnect or attribute change) never
  // leaves stale handlers attached.
  #release(key) {
    for (const m of this.#mediaMatches[key] ?? []) {
      m.removeEventListener("change", this.#handlers[key]);
    }
    this.#mediaMatches[key] = new Set();
  }
  static get observedAttributes() {
    return ["classes", "styles", "attributes"];
  }
  setClasses() {
    const queries = this.getAttribute("classes") || "";
    this.#classes = new Map();
    this.#release("classes");
    const mediaMatches = (this.#mediaMatches["classes"] = new Set());
    for (const { mql, value } of parseQuerySections(queries)) {
      this.#classes.set(mql, value.split(" ").filter(Boolean));
      mql.addEventListener("change", this.#handlers.classes);
      mediaMatches.add(mql);
    }
    this.triggerClass();
  }
  setStyles() {
    const queries = this.getAttribute("styles") || "";
    this.#styles = new Map();
    this.#release("styles");
    const mediaMatches = (this.#mediaMatches["styles"] = new Set());
    for (const { mql, value } of parseQuerySections(queries)) {
      this.#styles.set(
        mql,
        value
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean)
      );
      mql.addEventListener("change", this.#handlers.styles);
      mediaMatches.add(mql);
    }
    this.triggerStyle();
  }
  setAttributes() {
    const queries = this.getAttribute("attributes") || "";
    this.#attributes = new Map();
    this.#release("attributes");
    const mediaMatches = (this.#mediaMatches["attributes"] = new Set());
    for (const { mql, value } of parseQuerySections(queries)) {
      this.#attributes.set(
        mql,
        value
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean)
          .reduce((acc, curr) => {
            let [key, value] = curr.split("=", 2);
            key = (key ?? "").trim();
            if (!key) {
              // Malformed segment (e.g. "=foo" with no key) -- skip it,
              // don't drop the accumulator. Returning `acc` here (not
              // `undefined`) is the fix: the old code returned bare
              // `undefined` on this branch, which became the next
              // iteration's accumulator and crashed on the next .push().
              return acc;
            }
            if (value === undefined) {
              value = "";
            }
            if (value === "null") {
              value = null;
            }
            if (value) {
              value = stripQuotes(value.trim());
            }
            acc.push([key, value]);
            return acc;
          }, [])
      );
      mql.addEventListener("change", this.#handlers.attributes);
      mediaMatches.add(mql);
    }
    this.triggerAttribute();
  }
  triggerClass() {
    const classArray = this.getByKey("classes");
    for (const kid of this.kids) {
      const { classList } = kid;
      classList.remove(...classList);
      classList.add(...classArray);
    }
  }
  triggerStyle() {
    const styleArray = this.getByKey("styles");
    for (const kid of this.kids) {
      kid.setAttribute("style", styleArray.join(";"));
    }
  }
  triggerAttribute() {
    const attributeArray = this.getByKey("attributes");
    for (const kid of this.kids) {
      for (const [key, value] of attributeArray) {
        if (value === null) {
          kid.removeAttribute(key);
        } else {
          kid.setAttribute(key, value);
        }
      }
    }
  }
  setAll() {
    this.setClasses();
    this.setStyles();
    this.setAttributes();
  }
  attributeChangedCallback(name, prev, current) {
    this.setAll();
  }
  get kids() {
    return Array.prototype.filter.call(
      this.childNodes,
      (x) => x.nodeType === 1
    );
  }
  getByKey(key) {
    let result = [];
    let arr;
    switch (key) {
      case "classes":
        arr = this.#classes;
        break;
      case "styles":
        arr = this.#styles;
        break;
      case "attributes":
        arr = this.#attributes;
        break;
    }
    if (arr) {
      for (const [query, items] of arr) {
        if (query.matches) {
          result.push(...items);
        }
      }
    }
    return result;
  }
}
