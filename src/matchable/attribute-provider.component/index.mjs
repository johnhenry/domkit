const exp = /\[(.+)\](.+)/;

const stripQuotes = (string, quotes = ["'", '"', "`"]) => {
  for (const quote of quotes) {
    if (string.startsWith(quote) && string.endsWith(quote)) {
      return string.slice(1, -1);
    }
  }
  return string;
};

const parseQueries = (queries) =>
  queries
    .trim()
    .split("|")
    .map((x) => x.trim())
    .filter((x) => x);

export default class extends HTMLElement {
  #classes;
  #styles;
  #attributes;
  #observer;
  #mediaMatches;
  constructor() {
    super();
    this.#observer = new globalThis.MutationObserver(this.setAll.bind(this));
    this.#observer.observe(this, { childList: true });
    this.#mediaMatches = {};
  }
  connectedCallback() {}
  disconnectedCallback() {
    this.#observer.disconnect();
    for (const mediaMatches of Object.values(this.#mediaMatches)) {
      for (const m of mediaMatches) {
        m.onchange = null;
      }
    }
  }
  static get observedAttributes() {
    return ["classes", "styles", "attributes"];
  }
  setClasses() {
    const queries = this.getAttribute("classes") || "";
    this.#classes = new Map();
    const mediaMatches = (this.#mediaMatches["classes"] = new Set());
    for (const mediaQuery of parseQueries(queries)) {
      let query, selector;
      if (exp.test(mediaQuery)) {
        [, query, selector] = exp.exec(mediaQuery);
        query = query.trim();
        selector = selector.trim();
      } else {
        query = "";
        selector = mediaQuery.trim();
      }
      this.#classes.set(
        globalThis.matchMedia(query),
        selector.trim().split(" ")
      );

      const m = globalThis.matchMedia(query);
      m.onchange = (e) => {
        this.triggerClass(e);
      };
      mediaMatches.add(m);
    }
    this.triggerClass();
  }
  setStyles() {
    const queries = this.getAttribute("styles") || "";
    this.#styles = new Map();
    const mediaMatches = (this.#mediaMatches["styles"] = new Set());
    for (const mediaQuery of parseQueries(queries)) {
      let query, selector;
      if (exp.test(mediaQuery)) {
        [, query, selector] = exp.exec(mediaQuery);
        query = query.trim();
        selector = selector.trim();
      } else {
        query = "";
        selector = mediaQuery.trim();
      }
      this.#styles.set(
        globalThis.matchMedia(query),
        selector
          .trim()
          .split(";")
          .filter((x) => x)
      );

      const m = globalThis.matchMedia(query);
      m.onchange = (e) => {
        this.triggerStyle(e);
      };
      mediaMatches.add(m);
    }
    this.triggerStyle();
  }
  setAttributes() {
    const queries = this.getAttribute("attributes") || "";
    this.#attributes = new Map();
    const mediaMatches = (this.#mediaMatches["attributes"] = new Set());
    for (const mediaQuery of parseQueries(queries)) {
      let query, selector;
      if (exp.test(mediaQuery)) {
        [, query, selector] = exp.exec(mediaQuery);
        query = query.trim();
        selector = selector.trim();
      } else {
        query = "";
        selector = mediaQuery.trim();
      }

      this.#attributes.set(
        globalThis.matchMedia(query),
        selector
          .trim()
          .split(";")
          .filter((x) => x)
          .reduce((acc, curr) => {
            let [key, value] = curr.split("=", 2);
            if (!key) {
              return;
            }

            key = key.trim();
            if (value === undefined) {
              value = "";
            }
            if (value === "null") {
              value = null;
            }
            if (value) {
              value = stripQuotes(value.trim());
            }
            acc.push([key.trim(), value]);
            return acc;
          }, [])
      );

      const m = globalThis.matchMedia(query);
      m.onchange = (e) => {
        this.triggerAttribute(e);
      };
      mediaMatches.add(m);
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
