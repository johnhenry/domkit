// <stylable-select>: a listbox you can style, that behaves like a native
// <select size="…"> / <select multiple>: same properties, form
// participation, `input`/`change` events, and the WAI-ARIA listbox pattern.
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
//
// Options are <option> elements (their native state is used, so
// `option:checked` and `option:disabled` work in CSS) or any element with
// role="option". See readme.md for the full contract.

let uid = 0;
const setAttr = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};
const TYPEAHEAD_MS = 500;

/**
 * A listbox whose options are ordinary, fully stylable elements, with the
 * same API, form behavior, and events as a native `<select>` listbox.
 *
 * @tag stylable-select
 * @summary A fully stylable listbox that works like a native select.
 *
 * @attr {string} name - Name submitted with the form.
 * @attr {boolean} multiple - Allow selecting more than one option.
 * @attr {boolean} disabled - Blocks interaction and form submission. Also inherited from a disabled fieldset.
 * @attr {boolean} required - The form is invalid until an option is selected.
 * @attr {number} size - Number of visible rows (sets `--domkit-select-size`, used by index.css).
 *
 * @fires input - The user changed the selection.
 * @fires change - The user changed the selection (fired right after `input`, like a native select).
 *
 * @cssprop --domkit-select-size - Visible rows, from the `size` attribute.
 * @cssprop --domkit-highlight - Background of selected options (shared token; see theme.css).
 * @cssprop --domkit-focus-ring - Focus outline (shared token).
 */
export default class StylableSelect extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["disabled", "required", "multiple", "size"];

  #internals = this.attachInternals();
  #observer = new MutationObserver(() => this.#refresh());
  #active = null;
  #formDisabled = false;
  #typeahead = "";
  #typeaheadAt = 0;

  constructor() {
    super();
    this.addEventListener("click", (event) => this.#onClick(event));
    this.addEventListener("keydown", (event) => this.#onKeyDown(event));
    // A pointer press focuses the element before the click lands. Make the
    // pressed option the active one *first*, so the focus handler below
    // doesn't scroll the selected option into view and shift the list out
    // from under the pointer (the click would then miss).
    this.addEventListener("pointerdown", (event) => {
      const option = event.target instanceof Element ? event.target.closest('option, [role="option"]') : null;
      if (option && option.closest("stylable-select") === this) this.#setActive(option, { scroll: false });
    });
    this.addEventListener("focus", () => {
      if (!this.#active) this.#setActive(this.selectedOptions[0] ?? this.#enabled()[0]);
    });
  }

  connectedCallback() {
    this.#refresh();
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["selected", "disabled", "aria-disabled", "value", "data-value", "role", "label"],
    });
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback(name) {
    if (name === "size") {
      const size = this.size;
      if (size > 0) this.style.setProperty("--domkit-select-size", String(size));
      else this.style.removeProperty("--domkit-select-size");
    }
    if (name === "multiple" && !this.multiple) {
      // Like a native select switching to single: keep only the first.
      for (const option of this.selectedOptions.slice(1)) this.#mark(option, false);
    }
    this.#refresh();
  }

  // --- the HTMLSelectElement contract -------------------------------------

  /**
   * Every option, in document order (including those in groups).
   * @type {Element[]}
   * @readonly
   */
  get options() {
    return [...this.querySelectorAll('option, [role="option"]')].filter(
      (option) => option.closest("stylable-select") === this,
    );
  }

  /**
   * The selected options.
   * @type {Element[]}
   * @readonly
   */
  get selectedOptions() {
    return this.options.filter((option) => this.#isSelected(option));
  }

  /**
   * The first selected option, or null (like infinite-combo-box's).
   * @type {Element | null}
   * @readonly
   */
  get selectedOption() {
    return this.selectedOptions[0] ?? null;
  }

  /**
   * Index of the first selected option, or -1. Setting it selects only that
   * option. Script changes don't fire events.
   * @type {number}
   */
  get selectedIndex() {
    return this.options.findIndex((option) => this.#isSelected(option));
  }
  set selectedIndex(index) {
    const options = this.options;
    for (const [i, option] of options.entries()) this.#mark(option, i === Number(index));
    this.#refresh();
  }

  /**
   * Value of the first selected option, or "". Setting it selects the first
   * option with that value (or nothing, if none matches).
   * @type {string}
   */
  get value() {
    const option = this.selectedOptions[0];
    return option ? this.#valueOf(option) : "";
  }
  set value(value) {
    const options = this.options;
    const match = options.find((option) => this.#valueOf(option) === String(value));
    for (const option of options) this.#mark(option, option === match);
    this.#refresh();
  }

  /**
   * Number of options.
   * @type {number}
   * @readonly
   */
  get length() {
    return this.options.length;
  }

  /**
   * "select-one" or "select-multiple", like a native select.
   * @type {string}
   * @readonly
   */
  get type() {
    return this.multiple ? "select-multiple" : "select-one";
  }

  /** @type {string} */
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.setAttribute("name", value);
  }

  /** @type {boolean} */
  get multiple() {
    return this.hasAttribute("multiple");
  }
  set multiple(value) {
    this.toggleAttribute("multiple", Boolean(value));
  }

  /** @type {boolean} */
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  /** @type {boolean} */
  get required() {
    return this.hasAttribute("required");
  }
  set required(value) {
    this.toggleAttribute("required", Boolean(value));
  }

  /** @type {number} */
  get size() {
    const size = Number.parseInt(this.getAttribute("size") ?? "", 10);
    return Number.isFinite(size) && size > 0 ? size : 0;
  }
  set size(value) {
    this.setAttribute("size", String(value));
  }

  /**
   * The option at `index`.
   * @param {number} index
   * @returns {Element | null}
   */
  item(index) {
    return this.options[index] ?? null;
  }

  /**
   * The form this element belongs to.
   * @type {HTMLFormElement | null}
   * @readonly
   */
  get form() {
    return this.#internals.form;
  }
  /**
   * Labels associated with this element.
   * @type {NodeList}
   * @readonly
   */
  get labels() {
    return this.#internals.labels;
  }
  /**
   * @type {ValidityState}
   * @readonly
   */
  get validity() {
    return this.#internals.validity;
  }
  /**
   * @type {string}
   * @readonly
   */
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  /**
   * @type {boolean}
   * @readonly
   */
  get willValidate() {
    return this.#internals.willValidate;
  }
  /** @returns {boolean} */
  checkValidity() {
    return this.#internals.checkValidity();
  }
  /** @returns {boolean} */
  reportValidity() {
    return this.#internals.reportValidity();
  }
  /** @param {string} message */
  setCustomValidity(message) {
    this.#customError = String(message ?? "");
    this.#updateValidity();
  }
  #customError = "";

  // --- form lifecycle -----------------------------------------------------

  formResetCallback() {
    // Back to the markup's defaults: <option selected>, or for role=option
    // elements, whether they were selected when first seen.
    for (const option of this.options) {
      this.#mark(
        option,
        option.localName === "option" ? option.defaultSelected : this.#defaults.get(option) === true,
      );
    }
    this.#refresh();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#refresh();
  }

  formStateRestoreCallback(state) {
    const values = state instanceof FormData ? state.getAll(this.name) : [state];
    for (const option of this.options) {
      this.#mark(option, values.includes(this.#valueOf(option)));
    }
    this.#refresh();
  }

  // --- internals ----------------------------------------------------------

  #valueOf(option) {
    if (option.localName === "option") return option.value;
    return option.getAttribute("value") ?? option.getAttribute("data-value") ?? option.textContent.trim();
  }

  #isSelected(option) {
    return option.localName === "option"
      ? option.selected
      : option.getAttribute("aria-selected") === "true";
  }

  #isDisabled(option) {
    const authoredAria =
      option.getAttribute("aria-disabled") === "true" && !this.#ownAriaDisabled.has(option);
    return (
      authoredAria ||
      option.hasAttribute("disabled") ||
      option.closest("optgroup[disabled], [role='group'][aria-disabled='true']") !== null
    );
  }

  #isInteractive() {
    return !this.disabled && !this.#formDisabled;
  }

  #enabled() {
    return this.options.filter((option) => !this.#isDisabled(option));
  }

  // Set an option's selectedness: native state for <option>, aria for others.
  #mark(option, selected) {
    if (option.localName === "option") option.selected = selected;
    setAttr(option, "aria-selected", String(selected));
  }

  // Re-apply roles, ids, ARIA, form value, and validity to the current DOM.
  // Only writes attributes that actually change, so the MutationObserver
  // watching them can't feed back into itself.
  #refresh() {
    const options = this.options;
    for (const option of options) {
      if (!this.#defaults.has(option)) {
        this.#defaults.set(option, this.#isSelected(option));
      }
    }
    if (!this.multiple) {
      // At most one selected in single mode (e.g. two `selected` in markup):
      // like a native select, the last one wins.
      const selected = options.filter((option) => this.#isSelected(option));
      for (const option of selected.slice(0, -1)) this.#mark(option, false);
    }
    for (const option of options) {
      if (!option.hasAttribute("role")) option.setAttribute("role", "option");
      option.id ||= `stylable-select-option-${++uid}`;
      setAttr(option, "aria-selected", String(this.#isSelected(option)));
      if (this.#isDisabled(option)) {
        if (option.getAttribute("aria-disabled") !== "true") {
          option.setAttribute("aria-disabled", "true");
          this.#ownAriaDisabled.add(option);
        }
      } else if (this.#ownAriaDisabled.has(option)) {
        option.removeAttribute("aria-disabled");
        this.#ownAriaDisabled.delete(option);
      }
    }
    for (const group of this.querySelectorAll("optgroup")) {
      if (group.closest("stylable-select") !== this) continue;
      if (!group.hasAttribute("role")) group.setAttribute("role", "group");
      if (group.label && !group.hasAttribute("aria-label")) group.setAttribute("aria-label", group.label);
    }
    if (this.#active && !options.includes(this.#active)) this.#setActive(null);

    const interactive = this.#isInteractive();
    // Role and states as attributes (not just ElementInternals), so every
    // assistive technology and testing tool sees them. An authored role wins.
    if (!this.hasAttribute("role")) this.setAttribute("role", "listbox");
    setAttr(this, "aria-multiselectable", String(this.multiple));
    setAttr(this, "aria-disabled", String(!interactive));
    setAttr(this, "aria-required", String(this.required));
    // Focusable like a native control (unless the author manages tabindex),
    // and out of the tab order while disabled.
    if (this.#ownTabindex === null) this.#ownTabindex = !this.hasAttribute("tabindex");
    if (this.#ownTabindex) {
      if (interactive) setAttr(this, "tabindex", "0");
      else this.removeAttribute("tabindex");
    }
    this.#syncFormValue();
  }
  #ownTabindex = null;
  #defaults = new WeakMap();
  #ownAriaDisabled = new WeakSet();

  #syncFormValue() {
    const selected = this.selectedOptions;
    if (!this.name || !selected.length) {
      this.#internals.setFormValue(null);
    } else if (this.multiple) {
      const data = new FormData();
      for (const option of selected) data.append(this.name, this.#valueOf(option));
      this.#internals.setFormValue(data);
    } else {
      this.#internals.setFormValue(this.#valueOf(selected[0]));
    }
    this.#updateValidity();
  }

  #updateValidity() {
    if (this.#customError) {
      this.#internals.setValidity({ customError: true }, this.#customError);
    } else if (this.required && !this.selectedOptions.length) {
      this.#internals.setValidity({ valueMissing: true }, "Please select an item in the list.");
    } else {
      this.#internals.setValidity({});
    }
  }

  #setActive(option, { scroll = true } = {}) {
    if (this.#active) this.#active.removeAttribute("data-active");
    this.#active = option ?? null;
    if (option) {
      option.setAttribute("data-active", "");
      this.setAttribute("aria-activedescendant", option.id);
      if (scroll) option.scrollIntoView?.({ block: "nearest" });
    } else {
      this.removeAttribute("aria-activedescendant");
    }
  }

  // A user-made selection change: update, then fire input + change.
  #userSelect(option, { toggle = false } = {}) {
    if (!option || this.#isDisabled(option)) return;
    const before = this.selectedOptions;
    if (this.multiple && toggle) {
      this.#mark(option, !this.#isSelected(option));
    } else if (!this.multiple) {
      for (const other of this.options) this.#mark(other, other === option);
    }
    this.#refresh();
    this.#setActive(option, { scroll: !this.#clicking });
    const after = this.selectedOptions;
    const changed = before.length !== after.length || before.some((o, i) => o !== after[i]);
    if (changed) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  #clicking = false;
  #onClick(event) {
    if (!this.#isInteractive()) return;
    const option = event.target instanceof Element ? event.target.closest('option, [role="option"]') : null;
    if (!option || option.closest("stylable-select") !== this) return;
    this.#clicking = true;
    try {
      this.#userSelect(option, { toggle: true });
    } finally {
      this.#clicking = false;
    }
  }

  #onKeyDown(event) {
    if (!this.#isInteractive() || event.target !== this || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const enabled = this.#enabled();
    if (!enabled.length) return;
    const current = enabled.indexOf(this.#active);
    let next;
    switch (event.key) {
      case "ArrowDown":
        next = enabled[Math.min(current + 1, enabled.length - 1)] ?? enabled[0];
        break;
      case "ArrowUp":
        next = current < 0 ? enabled[0] : enabled[Math.max(current - 1, 0)];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled[enabled.length - 1];
        break;
      case " ":
      case "Enter":
        if (this.multiple && this.#active) {
          event.preventDefault();
          this.#userSelect(this.#active, { toggle: true });
        }
        return;
      default:
        if (event.key.length === 1 && event.key !== " ") {
          next = this.#typeaheadMatch(event.key, enabled, current);
          if (!next) return;
        } else {
          return;
        }
    }
    event.preventDefault();
    if (this.multiple) this.#setActive(next);
    else this.#userSelect(next);
  }

  // Native-select-style type-to-select: keys typed within 500ms build a
  // prefix; a repeated single character cycles through matches.
  #typeaheadMatch(key, enabled, current) {
    const now = Date.now();
    this.#typeahead = now - this.#typeaheadAt > TYPEAHEAD_MS ? key : this.#typeahead + key;
    this.#typeaheadAt = now;
    const prefix = this.#typeahead.toLowerCase();
    const repeated = [...prefix].every((c) => c === prefix[0]);
    const search = repeated ? prefix[0] : prefix;
    const start = repeated ? current + 1 : Math.max(current, 0);
    for (let i = 0; i < enabled.length; i++) {
      const option = enabled[(start + i) % enabled.length];
      if (option.textContent.trim().toLowerCase().startsWith(search)) return option;
    }
    return null;
  }
}
