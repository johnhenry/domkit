export default class extends globalThis.HTMLDialogElement {
  #keydownBound;
  #clickBound;
  #cancelBound;
  #hotkey;
  #modifiers = [];
  constructor() {
    super();
  }
  connectedCallback() {
    this.#clickBound = this.click.bind(this);
    this.#cancelBound = this.cancel.bind(this);
    this.#keydownBound = this.keydown.bind(this);
    document.addEventListener("keydown", this.#keydownBound);
    this.init();
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.#clickBound);
    document.removeEventListener("keydown", this.#keydownBound);
  }
  init() {
    if (this.getAttribute("click-to-close") === null) {
      this.removeEventListener("click", this.#clickBound);
    } else {
      this.addEventListener("click", this.#clickBound);
    }
    if (this.getAttribute("no-esc-close") === null) {
      this.removeEventListener("cancel", this.#cancelBound);
    } else {
      this.addEventListener("cancel", this.#cancelBound);
    }

    const [modifier, hotkey] = this.getAttribute("hotkey").split("+");
    if (hotkey) {
      this.#hotkey = hotkey;
      this.#modifiers = new Set(modifier.split(","));
    } else {
      this.#hotkey = modifier;
      this.#modifiers = new Set();
    }
  }
  cancel(event) {
    event.preventDefault();
  }

  keydown(event) {
    if (event.key === this.#hotkey) {
      if (this.#modifiers.has("alt") && !event.altKey) {
        return;
      }
      if (this.#modifiers.has("meta") && !event.metaKey) {
        return;
      }
      if (this.#modifiers.has("shift") && !event.shiftKey) {
        return;
      }
      if (this.#modifiers.has("ctrl") && !event.ctrlKey) {
        return;
      }

      if (this.getAttribute("open") === null) {
        this.showModal();
      } else {
        this.close();
      }
    }
  }
  click(event) {
    // const rect = this.getBoundingClientRect();
    // const isInDialog =
    //   rect.top <= event.clientY &&
    //   event.clientY <= rect.top + rect.height &&
    //   rect.left <= event.clientX &&
    //   event.clientX <= rect.left + rect.width;
    // if (!isInDialog) {
    //   this.close();
    // }
    if (event.target === this) {
      this.close();
    }
  }
  static get observedAttributes() {
    return ["hotkey", "click-to-close"];
  }
  attributeChangedCallback() {
    this.init();
  }
}
