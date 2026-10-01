import { tokenize } from "parsel-js";
import { parseQuerySections } from "../query-sections.mjs";
/*
  <query-component
    default="ul"
    query="[(min-width:300px) and (max-width:1200px)] ol.ordered[style=color:blue];"
  ></query-component>
  -- see readme.md for the full example.
*/
const elementFromSelector = (selector = "") => {
  let tag = "template";
  let id = undefined;
  const classes = [];
  const attributes = {};
  if (selector) {
    for (const token of tokenize(selector)) {
      switch (token.type) {
        case "id":
          id = token.name;
          break;
        case "type":
          tag = token.content;
          break;
        case "class":
          classes.push(token.name);
          break;
        case "attribute":
          attributes[token.name] = token.value;
          break;
      }
    }
  }
  const element = globalThis.document.createElement(tag); //tag
  if (id) {
    element.id = id;
  }
  element.classList.add(...classes); //classes
  for (const [key, value] of Object.entries(attributes)) {
    // attributes
    element.setAttribute(key, value);
  }
  return element;
};

export default class extends HTMLElement {
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
    return ["default", "query"];
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
    for (const { mql, value: selector } of parseQuerySections(queries)) {
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
