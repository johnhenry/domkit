// <attribute-cycler>: one setting, cycled through a fixed list of values
// on an attribute of some target element(s) (a class, by default),
// remembered in localStorage and kept in sync across tabs. Typically a
// theme switch. See readme.md.
//
//   <attribute-cycler attribute="data-theme" values="light,dark" storage-key="theme">
//     <button>Toggle theme</button>          <- cycles to the next value
//     <button value="dark">Dark</button>     <- sets that value (aria-pressed)
//     <output></output>                      <- shows the current value
//   </attribute-cycler>
//
// Buttons elsewhere can drive it with invoker commands:
//   <button commandfor="theme" command="--next">…</button>
import { applyValue, clearValue } from "../apply-value.mjs";

/**
 * Cycles an attribute (a class, by default) through a fixed list of values
 * on target elements, persisted to localStorage, driven by buttons inside
 * it or invoker commands.
 *
 * @tag attribute-cycler
 * @summary A persisted attribute or class switch (e.g. a theme toggle) driven by buttons.
 *
 * @attr {string} values - Comma-separated values to cycle through. An empty entry means "none": no class, or no attribute.
 * @attr {string} attribute - The attribute to set on the targets. Default `class`, where the value is one class among the target's others; any other attribute gets the value as its whole value.
 * @attr {string} target - Selector for the element(s) whose attribute is set. Default `html`.
 * @attr {string} storage-key - localStorage key to persist under. Without it, the value isn't persisted.
 * @attr {boolean} disabled - Its buttons are disabled, and invoker commands are ignored.
 * @attr {string} value - The current value. Reflects; set it to choose the initial value when nothing is stored.
 *
 * @fires change - The user changed the value with a button or command.
 */
export default class AttributeCycler extends HTMLElement {
  static observedAttributes = ["values", "attribute", "target", "storage-key", "value", "disabled"];
  #disabledButtons = new Set(); // buttons this element disabled

  #value = null;
  #reflecting = false;
  #onStorage = (event) => {
    if (event.key && event.key === this.storageKey && event.newValue !== null) {
      this.#set(event.newValue, { persist: false });
    }
  };

  constructor() {
    super();
    this.addEventListener("click", (event) => this.#onClick(event));
    // Invoker commands: <button commandfor="id" command="--next|--previous|--set">
    this.addEventListener("command", (event) => {
      if (this.disabled) return;
      const command = event.command;
      if (command === "--next") this.#userSet(this.#step(1));
      else if (command === "--previous") this.#userSet(this.#step(-1));
      else if (command === "--set") this.#userSet(event.source?.value ?? "");
    });
  }

  connectedCallback() {
    this.#applyDisabled();
    window.addEventListener("storage", this.#onStorage);
    this.#set(this.#initial(), { persist: false });
  }

  disconnectedCallback() {
    window.removeEventListener("storage", this.#onStorage);
  }

  attributeChangedCallback(name, previous, current) {
    if (name === "disabled") {
      this.#applyDisabled();
      return;
    }
    if (!this.isConnected || this.#reflecting) return;
    if (name === "value") {
      if (current !== null && current !== this.#value) this.#set(current);
    } else {
      // values, attribute, target, or storage-key changed: clear what was
      // set on the old targets or attribute, then re-apply.
      if (name === "target" && previous !== null) {
        for (const element of this.#query(previous)) clearValue(element, this.attribute, this.values);
      }
      if (name === "attribute") {
        for (const element of this.targets) clearValue(element, previous ?? "class", this.values);
      }
      this.#set(this.values.includes(this.#value) ? this.#value : this.#initial(), { persist: false });
    }
  }

  /**
   * The values to cycle through, in order.
   * @type {string[]}
   * @readonly
   */
  get values() {
    return (this.getAttribute("values") ?? "").split(",").map((value) => value.trim());
  }

  /**
   * The attribute set on the targets. Mirrors the `attribute` attribute.
   * @type {string}
   */
  get attribute() {
    return this.getAttribute("attribute")?.trim() || "class";
  }
  set attribute(value) {
    this.setAttribute("attribute", value);
  }

  /**
   * The current value. Setting it applies and persists it, without an event.
   * @type {string}
   */
  get value() {
    return this.#value ?? "";
  }
  set value(value) {
    this.#set(String(value));
  }

  /**
   * The elements whose attribute is set.
   * @type {Element[]}
   * @readonly
   */
  get targets() {
    return this.#query(this.getAttribute("target") ?? "html");
  }

  /**
   * Mirrors the `disabled` attribute.
   * @type {boolean}
   */
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  /** @type {string} */
  get storageKey() {
    return this.getAttribute("storage-key") ?? "";
  }
  set storageKey(value) {
    this.setAttribute("storage-key", value);
  }

  /** Move to the next value (wrapping), without an event. */
  next() {
    this.#set(this.#step(1));
  }

  /** Move to the previous value (wrapping), without an event. */
  previous() {
    this.#set(this.#step(-1));
  }

  #query(selector) {
    try {
      return [...document.querySelectorAll(selector)];
    } catch {
      return [];
    }
  }

  #stored() {
    if (!this.storageKey) return null;
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null; // storage blocked
    }
  }

  #initial() {
    const values = this.values;
    for (const candidate of [this.#stored(), this.getAttribute("value")]) {
      if (candidate !== null && values.includes(candidate)) return candidate;
    }
    return values[0] ?? "";
  }

  #step(delta) {
    const values = this.values;
    const index = values.indexOf(this.#value);
    return values[(index + delta + values.length) % values.length] ?? "";
  }

  #set(value, { persist = true } = {}) {
    const values = this.values;
    if (!values.includes(value)) return false;
    const previous = this.#value;
    this.#value = value;
    for (const element of this.targets) applyValue(element, this.attribute, values, value);
    if (persist && this.storageKey) {
      try {
        localStorage.setItem(this.storageKey, value);
      } catch {
        // storage blocked: the value still applies for this page
      }
    }
    this.#reflecting = true;
    this.setAttribute("value", value);
    this.#reflecting = false;
    for (const output of this.querySelectorAll("output")) output.value = value;
    for (const button of this.querySelectorAll("button[value]")) {
      button.setAttribute("aria-pressed", String(button.value === value));
    }
    return value !== previous;
  }

  #userSet(value) {
    if (this.#set(value)) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Disabled: its buttons are disabled too (native buttons then can't be
  // clicked or focused), and restored afterwards. Buttons the author had
  // disabled themselves stay disabled.
  #applyDisabled() {
    if (this.disabled) {
      for (const button of this.querySelectorAll("button")) {
        if (!button.disabled) {
          button.disabled = true;
          this.#disabledButtons.add(button);
        }
      }
    } else {
      for (const button of this.#disabledButtons) button.disabled = false;
      this.#disabledButtons.clear();
    }
  }

  #onClick(event) {
    if (this.disabled) return;
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || !this.contains(button) || button.disabled) return;
    // Buttons with an invoker command are handled by the command event.
    if (button.hasAttribute("commandfor")) return;
    if (button.hasAttribute("value")) this.#userSet(button.value);
    else if (button.dataset.cycle === "previous") this.#userSet(this.#step(-1));
    else this.#userSet(this.#step(1));
  }
}
