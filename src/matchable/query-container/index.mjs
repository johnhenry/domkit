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
 *
 * @fires change - A query started or stopped matching (the viewport or container changed), so `activeQueries` changed. The wrapper may have been swapped.
 */
export default class QueryContainer extends HTMLElement {
  static observedAttributes = ["default", "query", "container"];

  #content;
  #queries; // Map(mql -> wrapper element)
  #default;
  #matches = [];
  #observer = new MutationObserver(() => this.#wrapChildren());
  #onQuery = () => {
    this.#evaluate();
    if (this.#updateMatches()) this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  connectedCallback() {
    this.#observer.observe(this, { childList: true });
    // In container mode, the container depends on where the element now is:
    // re-parse against it.
    if (this.hasAttribute("container") && this.hasAttribute("query")) {
      this.#setQueries(this.getAttribute("query"));
      return;
    }
    // disconnectedCallback clears every media-query listener; restore them
    // on reconnect, or a moved element stops responding to the viewport.
    if (this.#queries) {
      for (const mql of this.#queries.keys()) mql.addEventListener("change", this.#onQuery);
      this.#evaluate();
      this.#updateMatches();
    }
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    for (const mql of this.#queries?.keys() ?? []) mql.removeEventListener("change", this.#onQuery);
  }

  attributeChangedCallback(name, previous, current) {
    if (name === "default") this.#setDefault(current);
    else if (name === "query") this.#setQueries(current);
    else if (name === "container" && this.hasAttribute("query")) this.#setQueries(this.getAttribute("query"));
  }

  /**
   * Mirrors the `default` attribute.
   * @type {string}
   */
  get default() {
    return this.getAttribute("default") ?? "";
  }
  set default(value) {
    this.setAttribute("default", value);
  }

  /**
   * Mirrors the `query` attribute.
   * @type {string}
   */
  get query() {
    return this.getAttribute("query") ?? "";
  }
  set query(value) {
    this.setAttribute("query", value);
  }

  /**
   * The media (or container) queries that currently match, in the order
   * they're written.
   * @type {string[]}
   * @readonly
   */
  get activeQueries() {
    return [...this.#matches];
  }

  /**
   * The element currently wrapping the children.
   * @type {Element | null}
   * @readonly
   */
  get wrapper() {
    return this.#content ?? null;
  }

  #setDefault(selector) {
    const previous = this.#content;
    this.#default = elementFromSelector(selector);
    this.#content = this.#default;
    // Carry content over if `default` changes after the first render.
    if (previous && previous.parentNode === this) {
      this.#content.append(...previous.childNodes);
      previous.remove();
    }
    this.appendChild(this.#content);
    // Wrap the children that were already there.
    this.#wrapChildren();
    this.#evaluate();
    this.#updateMatches();
  }

  #setQueries(queries) {
    for (const mql of this.#queries?.keys() ?? []) mql.removeEventListener("change", this.#onQuery);
    this.#queries = new Map();
    let firstSelector = "";
    for (const { mql, value: selector } of parseQuerySections(queries, { container: containerFor(this) })) {
      firstSelector ||= selector;
      this.#queries.set(mql, elementFromSelector(selector));
      mql.addEventListener("change", this.#onQuery);
    }
    if (this.#default) {
      this.#evaluate();
      this.#updateMatches();
    } else {
      this.#setDefault(firstSelector);
    }
  }

  // Swap in the wrapper of the last matching section (or the default).
  #evaluate() {
    let element = this.#default;
    for (const [mql, wrapper] of this.#queries ?? []) {
      if (mql.matches) element = wrapper;
    }
    if (element && this.contains(this.#content) && element !== this.#content) {
      element.append(...this.#content.childNodes);
      this.removeChild(this.#content);
      this.#content = element;
      this.appendChild(this.#content);
      this.#wrapChildren();
    }
  }

  // Returns whether the list of matching queries changed.
  #updateMatches() {
    const now = [...(this.#queries?.keys() ?? [])].filter((mql) => mql.media && mql.matches).map((mql) => mql.media);
    const changed = now.length !== this.#matches.length || now.some((media, i) => media !== this.#matches[i]);
    this.#matches = now;
    return changed;
  }

  // Move any child that isn't the wrapper into it.
  #wrapChildren() {
    if (!this.#content) return;
    for (const child of [...this.childNodes]) {
      if (child !== this.#content) this.#content.appendChild(child);
    }
  }
}
