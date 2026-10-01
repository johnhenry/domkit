import { parseQuerySections } from "../query-sections.mjs";
import { containerFor } from "../container-query.mjs";
import { elementFromSelector } from "../simple-selector.mjs";

/**
 * Wraps its children in a different element depending on media queries:
 * the same items in a `<ul>` on small screens and an `<ol>` on large ones.
 *
 * @tag query-container
 * @summary Swap the element wrapping some content by media query.
 *
 * @attr {string} default - Wrapper when no query matches, as a simple selector (`ul`, `ol.steps`, `div#x[data-y=z]`). Defaults to the first section's.
 * @attr {string} query - `[media query] selector` sections separated by `|`. The last matching section wins.
 * @attr {string} container - Container mode: evaluate the queries against an element's size instead of the viewport. Empty = the parent element; otherwise a selector for the closest matching ancestor.
 */
export default class QueryContainer extends HTMLElement {
  #content;
  #queries;
  #default;
  #observer;
  #onQuery = () => this.triggerQuery();
  constructor() {
    super();
  }
  connectedCallback() {
    this.#observer = new globalThis.MutationObserver(this.update.bind(this));
    this.#observer.observe(this, { childList: true });
    // In container mode, the container depends on where the element now is:
    // re-parse against it.
    if (this.hasAttribute("container") && this.hasAttribute("query")) {
      this.setQueries(this.getAttribute("query"));
      return;
    }
    // disconnectedCallback clears every media-query listener; restore them
    // on reconnect, or a moved element stops responding to the viewport.
    if (this.#queries) {
      for (const mql of this.#queries.keys()) {
        mql.addEventListener("change", this.#onQuery);
      }
      this.triggerQuery();
    }
  }
  disconnectedCallback() {
    this.#observer.disconnect();
    if (this.#queries) {
      for (const query of this.#queries.keys()) {
        query.removeEventListener("change", this.#onQuery);
      }
    }
  }
  static get observedAttributes() {
    return ["default", "query", "container"];
  }
  setInitial(selector) {
    const previous = this.#content;
    this.#default = elementFromSelector(selector);
    this.#content = this.#default;
    // Carry content over if `default` changes after the first render.
    if (previous && previous.parentNode === this) {
      this.#content.append(...previous.childNodes);
      previous.remove();
    }
    this.appendChild(this.#content);
    // Wrap the children that were already there -- previously they were
    // only moved in on a later swap or mutation, so when the default
    // wrapper applied from the start, it sat empty after its children.
    this.update();
    this.triggerQuery();
  }
  setQueries(queries) {
    for (const mql of this.#queries?.keys() ?? []) {
      mql.removeEventListener("change", this.#onQuery);
    }
    this.#queries = new Map();
    let firstSelector = "";
    for (const { mql, value: selector } of parseQuerySections(queries, { container: containerFor(this) })) {
      firstSelector = firstSelector || selector;
      this.#queries.set(mql, elementFromSelector(selector));
      mql.addEventListener("change", this.#onQuery);
    }
    if (this.#default) {
      this.triggerQuery();
    } else {
      this.setInitial(firstSelector);
    }
  }
  triggerQuery() {
    let element = this.#default;
    if (this.#queries) {
      for (const [query, selected] of this.#queries) {
        if (query.matches) {
          element = selected;
        }
      }
    }
    if (this.contains(this.#content)) {
      if (element !== this.#content) {
        element.append(...this.#content.childNodes);
        this.removeChild(this.#content);
        this.#content = element;
        this.appendChild(this.#content);
        this.update();
      }
    }
  }
  attributeChangedCallback(name, prev, current) {
    switch (name) {
      case "default":
        this.setInitial(current);
        break;
      case "query":
        this.setQueries(current);
        break;
      case "container":
        if (this.hasAttribute("query")) this.setQueries(this.getAttribute("query"));
        break;
    }
  }
  update() {
    for (const child of [...this.childNodes]) {
      if (child === this.#content) {
        continue;
      }
      if (this.#content) {
        this.#content.appendChild(child);
      }
    }
  }
}
