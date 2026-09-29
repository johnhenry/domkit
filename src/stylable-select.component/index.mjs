// https://stackoverflow.com/questions/635706/how-to-scroll-to-an-element-inside-a-div
export default class extends HTMLElement {
  #value;
  #selectedIndex = "";
  #onClickBound;
  #onKeyDownBound;
  #observer;
  constructor() {
    super();
    this.#onClickBound = this.onClick.bind(this);
    this.#onKeyDownBound = this.onKeyDown.bind(this);
    this.#observer = new MutationObserver(this.observe.bind(this));
  }
  observe(mutationList) {
    if (
      mutationList.filter((mutation) => mutation.type === "childList").length >
      0
    ) {
      this.selectedIndex = 0;
    }
  }
  get selectedIndex() {
    return this.#selectedIndex;
  }
  set selectedIndex(val) {
    const previouslyDefined = !!this.#selectedIndex;
    const options = this.options;
    if (val < 0) {
      val = 0;
    } else if (val >= options.length) {
      val = options.length - 1;
    }
    this.#selectedIndex = val ?? null;
    if (this.#selectedIndex !== null) {
      for (let i = 0; i < options.length; i++) {
        const element = options[i];
        if (i === this.#selectedIndex) {
          this.#value =
            element.getAttribute("value") ??
            element.getAttribute("data-value") ??
            element.textContent;
          this.dispatchEvent(
            new CustomEvent("change", { detail: this.#value })
          );
          element.setAttribute("data-checked", "");
          if (previouslyDefined) {
            element.scrollIntoView();
          }
        } else {
          element.removeAttribute("data-checked");
        }
      }
    }
  }
  get options() {
    const walker = globalThis.document.createTreeWalker(
      this,
      NodeFilter.SHOW_ELEMENT
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const roles = (node.getAttribute("role") || "").toLowerCase().split(" ");
      if (roles.includes("option")) {
        nodes.push(node);
      }
    }
    return Reflect.construct(Array, nodes, NodeList);
  }
  get value() {
    return this.#value;
  }
  onClick(e) {
    const index = [...this.options].indexOf(e.target);
    if (index > -1) {
      this.selectedIndex = index;
    }
  }
  onKeyDown(event) {
    event.stopPropagation();

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.selectedIndex--;
        break;
      case "ArrowDown":
        event.preventDefault();
        this.selectedIndex++;
        break;
    }
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClickBound, true);
    this.addEventListener("keydown", this.#onKeyDownBound, true);
    this.#observer.observe(this, { childList: true });
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.#onClickBound, true);
    this.removeEventListener("keydown", this.#onKeyDownBound, true);
    this.#observer.disconnect();
  }
  static get observedAttributes() {
    return ["size"];
  }
  attributeChangedCallback(name, prev, current) {
    if (prev !== current) {
      switch (name) {
        case "size":
          break;
      }
    }
  }
}
