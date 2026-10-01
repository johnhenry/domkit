// <combo-box>: a text input with a popup list of options, following the
// WAI-ARIA combobox pattern (list autocomplete).
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//
// Options come from, in order of precedence:
//   1. `searchFunction` (a property): async (query, { signal }) => results
//   2. `src` (an attribute): a URL template, `{query}` replaced
//   3. the element's own <option> children, filtered as you type
// Results may be an HTML string, an array of strings / { value, label } /
// Nodes, or a Node/DocumentFragment. No attribute is ever evaluated as
// code. See readme.md for the full contract.

let uid = 0;
const setAttr = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};
// Visually hidden but announced: the live region's only inline style.
const VISUALLY_HIDDEN =
  "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;padding:0";

/**
 * A text input with a popup list of options: filtered from its own
 * `<option>` children, fetched from a URL, or produced by a function.
 * Form-associated, with the WAI-ARIA combobox keyboard pattern.
 *
 * @tag combo-box
 * @summary An accessible autocomplete/search input with a popup option list.
 *
 * @attr {string} name - Name submitted with the form.
 * @attr {string} value - Initial value (the value of an option, or text with `allow-custom`).
 * @attr {string} placeholder - Placeholder for the input.
 * @attr {string} src - URL template for remote options; `{query}` is replaced with the encoded text. JSON or HTML responses.
 * @attr {number} debounce - Milliseconds to wait after typing before searching. Default 0 for local options, 200 for `src`/`searchFunction`.
 * @attr {number} min-length - Characters needed before searching. Default 0.
 * @attr {boolean} allow-custom - Typed text is a valid value even if it matches no option.
 * @attr {boolean} open - Whether the option list is showing. Reflects.
 * @attr {boolean} disabled - Blocks interaction and form submission. Also inherited from a disabled fieldset.
 * @attr {boolean} required - The form is invalid until there's a value.
 *
 * @fires input - The user changed the value (chose an option, or typed with `allow-custom`).
 * @fires change - The user committed a new value (chose an option, or left the field after typing with `allow-custom`).
 * @fires toggle - The list opened or closed (a ToggleEvent with `oldState`/`newState`, like a popover).
 *
 * @cssprop --domkit-combo-accent - Background of the active option (index.css).
 */
export default class ComboBox extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["placeholder", "disabled", "required", "open", "value", "src"];

  #internals = this.attachInternals();
  #input = null;
  #list = null;
  #status = null;
  #source = []; // the author's own <option>s, kept outside the DOM
  #value = "";
  #defaultValue = null;
  #selected = null; // the chosen option element, if it's rendered
  #committed = ""; // value at last change event
  #active = null;
  #timer = 0;
  #abort = null;
  #formDisabled = false;
  #searchFunction = null;
  #labelClick = () => this.#input?.focus();
  #observedLabels = [];

  constructor() {
    super();
    this.addEventListener("keydown", (event) => this.#onKeyDown(event));
    this.addEventListener("focusout", (event) => {
      if (!this.contains(event.relatedTarget)) this.#onLeave();
    });
  }

  connectedCallback() {
    this.#build();
    this.#bindLabels();
    this.#refresh();
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#abort?.abort();
    for (const label of this.#observedLabels) label.removeEventListener("click", this.#labelClick);
    this.#observedLabels = [];
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.#input) {
      if (name === "value") this.#value = current ?? "";
      return;
    }
    if (name === "placeholder") {
      if (current === null) this.#input.removeAttribute("placeholder");
      else this.#input.placeholder = current;
    } else if (name === "open") {
      this.#setOpen(current !== null);
    } else if (name === "value" && previous !== current) {
      // Like <input value>: the attribute is the default value (what
      // form.reset() restores), and changing it updates the current value.
      this.#defaultValue = current ?? "";
      if (current !== this.#value) this.value = current ?? "";
    }
    this.#refresh();
  }

  // --- public API -----------------------------------------------------------

  /**
   * The current value: the chosen option's value, or the typed text with
   * `allow-custom`. Setting it chooses the matching option (by value, then
   * by label). Script changes don't fire events.
   * @type {string}
   */
  get value() {
    return this.#value;
  }
  set value(value) {
    value = String(value ?? "");
    const option = this.#findOption(value);
    if (option) {
      this.#choose(option, { user: false });
    } else {
      this.#selected = null;
      this.#value = this.allowCustom ? value : "";
      if (this.#input) this.#input.value = this.allowCustom ? value : "";
      this.#committed = this.#value;
      this.#refresh();
    }
  }

  /**
   * The text in the input.
   * @type {string}
   */
  get text() {
    return this.#input?.value ?? "";
  }
  set text(text) {
    if (this.#input) this.#input.value = String(text);
  }

  /**
   * The options currently in the list.
   * @type {Element[]}
   * @readonly
   */
  get options() {
    return this.#list ? [...this.#list.querySelectorAll('option, [role="option"]')] : [];
  }

  /**
   * The chosen option element, if it's in the list.
   * @type {Element | null}
   * @readonly
   */
  get selectedOption() {
    return this.#selected;
  }

  /**
   * The inner `<input>` (generated, or the one you wrote as a child).
   * @type {HTMLInputElement | null}
   * @readonly
   */
  get input() {
    return this.#input;
  }

  /**
   * A function that produces options for a query, instead of filtering the
   * child `<option>`s or fetching `src`: `async (query, { signal }) =>`
   * an HTML string, an array of strings / `{ value, label }` / Nodes, or a
   * Node. `signal` aborts when a newer search starts.
   * @type {((query: string, init: { signal: AbortSignal }) => unknown) | null}
   */
  get searchFunction() {
    return this.#searchFunction;
  }
  set searchFunction(fn) {
    this.#searchFunction = typeof fn === "function" ? fn : null;
  }

  /** @type {boolean} */
  get open() {
    return this.hasAttribute("open");
  }
  set open(value) {
    this.toggleAttribute("open", Boolean(value));
  }

  /** @type {string} */
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.setAttribute("name", value);
  }

  /** @type {string} */
  get src() {
    return this.getAttribute("src") ?? "";
  }
  set src(value) {
    this.setAttribute("src", value);
  }

  /** @type {boolean} */
  get allowCustom() {
    return this.hasAttribute("allow-custom");
  }
  set allowCustom(value) {
    this.toggleAttribute("allow-custom", Boolean(value));
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

  /**
   * @type {HTMLFormElement | null}
   * @readonly
   */
  get form() {
    return this.#internals.form;
  }
  /**
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
    this.#refresh();
  }
  #customError = "";

  /**
   * Focus the input.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    this.#input?.focus(options);
  }

  // --- form lifecycle -------------------------------------------------------

  formResetCallback() {
    this.value = this.#defaultValue ?? "";
    this.#setOpen(false);
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#refresh();
  }

  formStateRestoreCallback(state) {
    if (typeof state === "string") this.value = state;
  }

  // --- structure ------------------------------------------------------------

  #build() {
    if (this.#input) return;
    // Use an <input> the author wrote, or make one.
    this.#input = this.querySelector(":scope > input") ?? document.createElement("input");
    const input = this.#input;
    input.removeAttribute("name"); // the element submits, not the input
    input.type = input.type === "search" ? "search" : "text";
    input.autocomplete = "off";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.id ||= `combo-box-input-${++uid}`;
    if (this.hasAttribute("placeholder")) input.placeholder = this.getAttribute("placeholder");

    this.#list = document.createElement("div");
    this.#list.setAttribute("role", "listbox");
    this.#list.id = `combo-box-list-${++uid}`;
    this.#list.hidden = true;
    input.setAttribute("aria-controls", this.#list.id);

    this.#status = document.createElement("span");
    this.#status.setAttribute("role", "status");
    this.#status.style.cssText = VISUALLY_HIDDEN;

    // The author's <option>s become the local source; they're rendered into
    // the list as needed.
    this.#source = [...this.children].filter(
      (child) => child.localName === "option" || child.getAttribute("role") === "option",
    );
    for (const option of this.#source) option.remove();
    // Any <optgroup>s are flattened into the source, keeping their label.
    for (const group of [...this.querySelectorAll(":scope > optgroup")]) {
      for (const option of group.querySelectorAll("option")) {
        option.dataset.group = group.label;
        this.#source.push(option);
      }
      group.remove();
    }

    if (!input.isConnected) this.prepend(input);
    input.after(this.#list, this.#status);

    input.addEventListener("input", (event) => {
      event.stopPropagation(); // the host fires its own input, when its value changes
      this.#onType();
    });
    input.addEventListener("change", (event) => event.stopPropagation());
    input.addEventListener("click", () => {
      if (!this.open) this.#search(input.value, { immediate: true });
    });
    this.#list.addEventListener("pointerdown", (event) => event.preventDefault()); // keep focus in the input
    this.#list.addEventListener("click", (event) => {
      const option = this.#optionFrom(event.target);
      if (option && !this.#isDisabled(option)) {
        this.#choose(option, { user: true });
        this.#setOpen(false);
      }
    });

    // Initial value: the attribute, else a `selected` option.
    const initial =
      this.getAttribute("value") ??
      (this.#source.find((option) => option.hasAttribute("selected")) &&
        this.#valueOf(this.#source.find((option) => option.hasAttribute("selected"))));
    this.#defaultValue = initial ?? "";
    if (initial) this.value = initial;
  }

  #bindLabels() {
    for (const label of this.#observedLabels) label.removeEventListener("click", this.#labelClick);
    this.#observedLabels = [...(this.#internals.labels ?? [])];
    for (const label of this.#observedLabels) label.addEventListener("click", this.#labelClick);
    // Name the combobox input by the element's labels (they point at the
    // element, but the input is what assistive technology focuses).
    if (this.#observedLabels.length && !this.#input.hasAttribute("aria-label")) {
      for (const label of this.#observedLabels) label.id ||= `combo-box-label-${++uid}`;
      this.#input.setAttribute("aria-labelledby", this.#observedLabels.map((l) => l.id).join(" "));
    } else if (this.hasAttribute("aria-label") && !this.#input.hasAttribute("aria-label")) {
      this.#input.setAttribute("aria-label", this.getAttribute("aria-label"));
    }
  }

  #refresh() {
    if (!this.#input) return;
    const interactive = !this.disabled && !this.#formDisabled;
    this.#input.disabled = !interactive;
    this.#input.required = this.required;
    this.#internals.setFormValue(this.name && this.#value ? this.#value : null);
    if (this.#customError) {
      this.#internals.setValidity({ customError: true }, this.#customError, this.#input);
    } else if (this.required && !this.#value) {
      this.#internals.setValidity({ valueMissing: true }, "Please fill out this field.", this.#input);
    } else {
      this.#internals.setValidity({});
    }
  }

  // --- options --------------------------------------------------------------

  #valueOf(option) {
    if (option.localName === "option") return option.value;
    return option.getAttribute("value") ?? option.getAttribute("data-value") ?? option.textContent.trim();
  }

  #labelOf(option) {
    return (option.localName === "option" ? option.label : option.getAttribute("label")) || option.textContent.trim();
  }

  #isDisabled(option) {
    return option.hasAttribute("disabled") || option.getAttribute("aria-disabled") === "true";
  }

  #optionFrom(target) {
    const option = target instanceof Element ? target.closest('option, [role="option"]') : null;
    return option && this.#list.contains(option) ? option : null;
  }

  #findOption(value) {
    const candidates = [...this.options, ...this.#source];
    return (
      candidates.find((option) => this.#valueOf(option) === value) ??
      candidates.find((option) => this.#labelOf(option) === value) ??
      null
    );
  }

  // Normalize any supported result shape into option elements.
  #toOptions(result) {
    if (result == null) return [];
    if (typeof result === "string") {
      const template = document.createElement("template");
      template.innerHTML = result;
      return this.#toOptions(template.content);
    }
    if (result instanceof DocumentFragment || (result instanceof Element && !this.#looksLikeOption(result))) {
      return [...result.querySelectorAll('option, [role="option"]')];
    }
    if (result instanceof Element) return [result];
    if (typeof result[Symbol.iterator] === "function") {
      return [...result].flatMap((item) => {
        if (item instanceof Node) return this.#toOptions(item);
        const option = document.createElement("option");
        if (typeof item === "object" && item) {
          option.value = String(item.value ?? item.label ?? "");
          option.textContent = String(item.label ?? item.value ?? "");
          if (item.disabled) option.disabled = true;
        } else {
          option.value = option.textContent = String(item);
        }
        return [option];
      });
    }
    return [];
  }

  #looksLikeOption(element) {
    return element.localName === "option" || element.getAttribute("role") === "option";
  }

  #render(options) {
    this.#list.replaceChildren(...options);
    let group = null;
    for (const option of options) {
      if (!option.hasAttribute("role")) option.setAttribute("role", "option");
      option.id ||= `combo-box-option-${++uid}`;
      const selected = this.#value !== "" && this.#valueOf(option) === this.#value;
      if (selected) this.#selected = option;
      setAttr(option, "aria-selected", String(selected));
      if (option.localName === "option") option.selected = selected;
      if (this.#isDisabled(option)) setAttr(option, "aria-disabled", "true");
      // Re-create local <optgroup> headings as presentation-only labels.
      if (option.dataset.group && option.dataset.group !== group) {
        group = option.dataset.group;
        const heading = document.createElement("div");
        heading.setAttribute("role", "presentation");
        heading.dataset.groupLabel = "";
        heading.textContent = group;
        option.before(heading);
      }
    }
    this.#setActive(null);
  }

  // --- searching ------------------------------------------------------------

  #onType() {
    const text = this.#input.value;
    // With allow-custom the text is the value; otherwise clearing the text
    // clears the value (choosing an option is the only other way to set it).
    const next = this.allowCustom ? text : text === "" ? "" : this.#value;
    if (next !== this.#value) {
      this.#selected = null;
      this.#value = next;
      this.#refresh();
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    this.#search(text);
  }

  #search(query, { immediate = false } = {}) {
    clearTimeout(this.#timer);
    this.#abort?.abort();
    const minLength = Number(this.getAttribute("min-length")) || 0;
    if (query.length < minLength) {
      this.#setOpen(false);
      return;
    }
    const remote = this.#searchFunction || this.src;
    const fallback = remote ? 200 : 0;
    const debounce = immediate ? 0 : Number(this.getAttribute("debounce") ?? fallback) || 0;
    const run = () => this.#runSearch(query);
    if (debounce > 0) this.#timer = setTimeout(run, debounce);
    else run();
  }

  async #runSearch(query) {
    const controller = new AbortController();
    this.#abort = controller;
    const { signal } = controller;
    let results;
    if (this.#searchFunction || this.src) {
      if (!query && this.#source.length) {
        results = this.#source.map((option) => option.cloneNode(true));
      } else {
        this.#setBusy(true);
        try {
          results = this.#toOptions(
            this.#searchFunction
              ? await this.#searchFunction(query, { signal })
              : await this.#fetch(query, signal),
          );
        } catch (error) {
          if (signal.aborted) return;
          this.#setBusy(false);
          this.#announce("Couldn't load results.");
          this.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) }));
          return;
        }
        if (signal.aborted) return; // superseded by a newer search
        this.#setBusy(false);
      }
    } else {
      const needle = query.trim().toLowerCase();
      results = this.#source
        .filter((option) => !needle || this.#labelOf(option).toLowerCase().includes(needle))
        .map((option) => option.cloneNode(true));
    }
    this.#render(results);
    this.#announce(
      results.length ? `${results.length} result${results.length === 1 ? "" : "s"} available.` : "No results.",
    );
    this.#setOpen(results.length > 0 || Boolean(query));
  }

  async #fetch(query, signal) {
    const template = this.src;
    const encoded = encodeURIComponent(query);
    const url = new URL(
      template.includes("{query}") ? template.replaceAll("{query}", encoded) : template,
      document.baseURI,
    );
    if (!template.includes("{query}")) url.searchParams.set("q", query);
    const response = await fetch(url, { signal, headers: { accept: "application/json, text/html;q=0.9" } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const type = response.headers.get("content-type") ?? "";
    return type.includes("json") ? response.json() : response.text();
  }

  #setBusy(busy) {
    setAttr(this.#list, "aria-busy", String(busy));
    try {
      if (busy) this.#internals.states.add("loading");
      else this.#internals.states.delete("loading");
    } catch {
      // CustomStateSet unsupported: aria-busy is still set.
    }
    if (busy) this.#announce("Loading…");
  }

  #announce(message) {
    this.#status.textContent = message;
  }

  // --- choosing -------------------------------------------------------------

  #choose(option, { user }) {
    const before = this.#value;
    this.#selected = option;
    this.#value = this.#valueOf(option);
    if (this.#input) this.#input.value = this.#labelOf(option);
    for (const other of this.options) {
      const selected = other === option;
      setAttr(other, "aria-selected", String(selected));
      if (other.localName === "option") other.selected = selected;
    }
    this.#refresh();
    if (user && this.#value !== before) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    if (user && this.#value !== this.#committed) {
      this.#committed = this.#value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (!user) this.#committed = this.#value;
  }

  #onLeave() {
    this.#setOpen(false);
    if (!this.allowCustom && this.#input) {
      // Select-only: once focus leaves, the text shows the chosen option's
      // label, or nothing.
      this.#input.value = this.#selected ? this.#labelOf(this.#selected) : "";
    }
    if (this.#value !== this.#committed) {
      this.#committed = this.#value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  #setOpen(open) {
    if (!this.#list) return;
    const wasOpen = !this.#list.hidden;
    this.#list.hidden = !open;
    this.#input.setAttribute("aria-expanded", String(open));
    if (open !== this.hasAttribute("open")) this.toggleAttribute("open", open);
    if (!open) this.#setActive(null);
    if (wasOpen !== open) {
      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: wasOpen ? "open" : "closed", newState: open ? "open" : "closed" }),
      );
    }
  }

  #setActive(option) {
    this.#active?.removeAttribute("data-active");
    this.#active = option;
    if (option) {
      option.setAttribute("data-active", "");
      this.#input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView?.({ block: "nearest" });
    } else {
      this.#input?.removeAttribute("aria-activedescendant");
    }
  }

  #onKeyDown(event) {
    if (event.target !== this.#input || this.#input.disabled) return;
    const enabled = this.options.filter((option) => !this.#isDisabled(option));
    const index = enabled.indexOf(this.#active);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!this.open) {
          this.#search(this.#input.value, { immediate: true });
          return;
        }
        if (event.altKey) return;
        this.#setActive(enabled[index + 1] ?? enabled[0] ?? null);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) {
          this.#setOpen(false);
          return;
        }
        if (!this.open) {
          this.#search(this.#input.value, { immediate: true });
          return;
        }
        this.#setActive(enabled[index - 1] ?? enabled[enabled.length - 1] ?? null);
        return;
      case "Enter":
        if (this.open && this.#active) {
          event.preventDefault(); // don't submit the form while choosing
          this.#choose(this.#active, { user: true });
          this.#setOpen(false);
        } else if (this.allowCustom && this.#value !== this.#committed) {
          this.#committed = this.#value;
          this.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return;
      case "Escape":
        if (this.open) {
          event.preventDefault();
          this.#setOpen(false);
        } else if (this.#input.value) {
          event.preventDefault();
          this.#input.value = "";
          if (this.allowCustom) this.#onType();
        }
        return;
      case "Tab":
        this.#setOpen(false);
        return;
    }
  }
}
