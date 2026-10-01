// <attribute-provider>: add classes, inline styles, and attributes to its
// direct children while media queries match, and take them away again
// when they stop matching -- without disturbing anything the children
// already had. See readme.md.
import { parseQuerySections } from "../query-sections.mjs";
import { containerFor } from "../container-query.mjs";

const stripQuotes = (string) => {
  for (const quote of ["'", '"', "`"]) {
    if (string.length >= 2 && string.startsWith(quote) && string.endsWith(quote)) {
      return string.slice(1, -1);
    }
  }
  return string;
};

const parsers = {
  classes: (value) => value.split(/\s+/).filter(Boolean),
  // "color: red; border: 1px solid" -> [["color", "red"], ["border", "1px solid"]]
  styles: (value) =>
    value
      .split(";")
      .map((declaration) => {
        const colon = declaration.indexOf(":");
        return colon < 0 ? null : [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
      })
      .filter((pair) => pair && pair[0]),
  // "disabled; placeholder='Search'; hidden=null" -> [[name, value | null]]
  attributes: (value) =>
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const equals = part.indexOf("=");
        const name = (equals < 0 ? part : part.slice(0, equals)).trim();
        const raw = equals < 0 ? "" : part.slice(equals + 1).trim();
        return [name, raw === "null" ? null : stripQuotes(raw)];
      })
      .filter(([name]) => name),
};

/**
 * Applies classes, inline styles, and attributes to its direct children
 * while media queries match, restoring what was there when they stop.
 *
 * @tag attribute-provider
 * @summary Add classes, styles, and attributes to children by media query.
 *
 * @attr {string} classes - `[media query] class class | …` sections. Bracket-less sections always apply.
 * @attr {string} styles - `[media query] property: value; … | …` sections.
 * @attr {string} attributes - `[media query] name=value; name; name=null | …` sections. `null` removes the attribute while the query matches.
 * @attr {string} container - Container mode: evaluate the queries against an element's size instead of the viewport. Empty = the parent element; otherwise a selector for the closest matching ancestor.
 */
export default class AttributeProvider extends HTMLElement {
  static observedAttributes = ["classes", "styles", "attributes", "container"];

  #sections = { classes: [], styles: [], attributes: [] };
  #onChange = () => this.#apply();
  #observer = new MutationObserver(() => this.#apply());
  // What this element changed on each child, so it can be undone exactly.
  #addedClasses = new WeakMap(); // child -> Set(class)
  #savedStyles = new WeakMap(); // child -> Map(property -> [value, priority])
  #savedAttributes = new WeakMap(); // child -> Map(name -> original value | null)
  #touched = new Set();

  connectedCallback() {
    for (const kind of Object.keys(parsers)) this.#parse(kind);
    this.#observer.observe(this, { childList: true });
    this.#apply();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    for (const kind of Object.keys(parsers)) this.#release(kind);
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === "container") for (const kind of Object.keys(parsers)) this.#parse(kind);
    else this.#parse(name);
    this.#apply();
  }

  #parse(kind) {
    this.#release(kind);
    const container = containerFor(this);
    this.#sections[kind] = parseQuerySections(this.getAttribute(kind) ?? "", { container }).map(({ mql, value }) => {
      mql.addEventListener("change", this.#onChange);
      return { mql, items: parsers[kind](value) };
    });
  }

  #release(kind) {
    for (const { mql } of this.#sections[kind]) mql.removeEventListener("change", this.#onChange);
    this.#sections[kind] = [];
  }

  #active(kind) {
    return this.#sections[kind].filter(({ mql }) => mql.matches).flatMap(({ items }) => items);
  }

  get #children() {
    return [...this.children];
  }

  #apply() {
    const classes = new Set(this.#active("classes"));
    const styles = new Map(this.#active("styles")); // later sections win
    const attributes = new Map(this.#active("attributes"));
    const children = new Set(this.#children);

    // Children that left: undo everything first.
    for (const child of this.#touched) {
      if (!children.has(child)) this.#restore(child, new Set(), new Map(), new Map());
    }
    this.#touched = new Set();
    for (const child of children) {
      this.#restore(child, classes, styles, attributes);
      this.#applyTo(child, classes, styles, attributes);
      this.#touched.add(child);
    }
  }

  // Undo what's no longer wanted.
  #restore(child, classes, styles, attributes) {
    const added = this.#addedClasses.get(child);
    for (const name of added ?? []) {
      if (!classes.has(name)) {
        child.classList.remove(name);
        added.delete(name);
      }
    }
    const savedStyles = this.#savedStyles.get(child);
    for (const [property, [value, priority]] of savedStyles ?? []) {
      if (!styles.has(property)) {
        if (value) child.style.setProperty(property, value, priority);
        else child.style.removeProperty(property);
        savedStyles.delete(property);
      }
    }
    const savedAttributes = this.#savedAttributes.get(child);
    for (const [name, original] of savedAttributes ?? []) {
      if (!attributes.has(name)) {
        if (original === null) child.removeAttribute(name);
        else child.setAttribute(name, original);
        savedAttributes.delete(name);
      }
    }
  }

  // Apply what's wanted, remembering what was there first.
  #applyTo(child, classes, styles, attributes) {
    if (!this.#addedClasses.has(child)) this.#addedClasses.set(child, new Set());
    const added = this.#addedClasses.get(child);
    for (const name of classes) {
      if (!child.classList.contains(name)) {
        child.classList.add(name);
        added.add(name);
      }
    }
    if (!this.#savedStyles.has(child)) this.#savedStyles.set(child, new Map());
    const savedStyles = this.#savedStyles.get(child);
    for (const [property, value] of styles) {
      if (!savedStyles.has(property)) {
        savedStyles.set(property, [child.style.getPropertyValue(property), child.style.getPropertyPriority(property)]);
      }
      const important = /!\s*important\s*$/i.test(value);
      child.style.setProperty(property, value.replace(/!\s*important\s*$/i, "").trim(), important ? "important" : "");
    }
    if (!this.#savedAttributes.has(child)) this.#savedAttributes.set(child, new Map());
    const savedAttributes = this.#savedAttributes.get(child);
    for (const [name, value] of attributes) {
      if (!savedAttributes.has(name)) savedAttributes.set(name, child.getAttribute(name));
      if (value === null) child.removeAttribute(name);
      else child.setAttribute(name, value);
    }
  }
}
