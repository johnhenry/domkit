// <infinite-combo-box>: a text input with a popup list of options, following the
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

import { valueMissingText } from "../native-validation.mjs";

let uid = 0;

// Every string the element shows or announces. Override any of them with
// the `strings` property or a <script type="application/json" data-strings>
// child. A value can be a plural map ({ one, other, … }, chosen with
// Intl.PluralRules for the element's language); {count}, {shown}, and
// {total} are replaced with numbers formatted for that language.
/** @type {Readonly<Record<string, string | Record<string, string>>>} The English defaults for the `strings` property. */
export const DEFAULT_STRINGS = {
  loadMore: "Load more results",
  loading: "Loading…",
  loadingMore: "Loading more results…",
  noResults: "No results.",
  available: { one: "{count} result available.", other: "{count} results available." },
  availableMore: {
    one: "{count} result available, more can be loaded.",
    other: "{count} results available, more can be loaded.",
  },
  shownOfTotal: "{shown} of {total} results shown.",
  loadedMore: { one: "{count} more result loaded.", other: "{count} more results loaded." },
  loadedMoreOfTotal: { one: "{count} more result loaded, {shown} of {total}.", other: "{count} more results loaded, {shown} of {total}." },
  loadFailed: "Couldn't load results.",
  loadMoreFailed: "Couldn't load more results.",
};
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
 * @tag infinite-combo-box
 * @summary An accessible autocomplete with paged ("infinite") results.
 *
 * @attr {string} name - Name submitted with the form.
 * @attr {string} value - Initial value (the value of an option, or text with `allow-custom`).
 * @attr {string} placeholder - Placeholder for the input.
 * @attr {string} src - URL template for remote options: `{query}` and `{cursor}` are replaced (missing ones are added as `?q=`/`?cursor=`). JSON (an array, or `{ options, next, total }`) or HTML (with an optional `data-next` element).
 * @attr {number} debounce - Milliseconds to wait after typing before searching. Default 0 for local options, 200 for `src`/`searchFunction`.
 * @attr {number} page-size - Show the element's own matching options this many at a time, loading more as the list scrolls.
 * @attr {number} min-length - Characters needed before searching. Default 0.
 * @attr {boolean} inline - Render the list in normal flow under the input, instead of as a floating popup in the top layer.
 * @attr {boolean} allow-custom - Typed text is a valid value even if it matches no option.
 * @attr {boolean} open - Whether the option list is showing. Reflects.
 * @attr {boolean} disabled - Blocks interaction and form submission. Also inherited from a disabled fieldset.
 * @attr {boolean} required - The form is invalid until there's a value.
 *
 * @fires input - The user changed the value (chose an option, or typed with `allow-custom`).
 * @fires change - The user committed a new value (chose an option, or left the field after typing with `allow-custom`).
 * @fires toggle - The list opened or closed (a ToggleEvent with `oldState`/`newState`, like a popover).
 *
 * @cssprop --domkit-highlight - Background of the active option (shared token; see theme.css).
 * @cssprop --domkit-surface - Background of the popup list (shared token).
 */
export default class InfiniteComboBox extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["placeholder", "disabled", "required", "open", "value", "src", "inline"];

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
  // Paging: the query being paged, the cursor for its next page (null = no
  // more), the total if the source reported one, local matches for
  // page-size paging, and the "Load more results" option.
  #query = "";
  #next = null;
  #total = null;
  #localMatches = null;
  #loadingMore = false;
  #more = null;
  #moreObserver = null;
  #lastGroup = null;
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

  // --- floating list ---------------------------------------------------------
  // Unless `inline`, the open list is a manual popover in the top layer, so
  // no ancestor's overflow, z-index, or transform can clip or cover it. It's
  // positioned here (not by index.css) so it works with no stylesheet: under
  // the input, matching its width, flipped above when there isn't room
  // below, and kept in place while the page scrolls or resizes.
  #floating = false;
  #reposition = () => this.#place();

  get #canFloat() {
    return !this.hasAttribute("inline") && typeof this.#list?.showPopover === "function";
  }

  #float(open) {
    const list = this.#list;
    if (open && this.#canFloat) {
      if (!list.hasAttribute("popover")) list.setAttribute("popover", "manual");
      if (!list.matches(":popover-open")) list.showPopover();
      if (!this.#floating) {
        this.#floating = true;
        window.addEventListener("scroll", this.#reposition, { capture: true, passive: true });
        window.addEventListener("resize", this.#reposition, { passive: true });
      }
      this.#place();
      return;
    }
    if (list.matches?.(":popover-open")) list.hidePopover();
    if (!this.#canFloat && list.hasAttribute("popover")) {
      list.removeAttribute("popover");
      for (const property of ["position", "inset", "top", "left", "width", "max-height", "margin", "box-sizing"]) list.style.removeProperty(property);
    }
    if (this.#floating) {
      this.#floating = false;
      window.removeEventListener("scroll", this.#reposition, { capture: true });
      window.removeEventListener("resize", this.#reposition);
    }
  }

  #place() {
    const list = this.#list;
    if (!list.matches(":popover-open")) return;
    const box = this.#input.getBoundingClientRect();
    const gap = 4;
    const viewport = document.documentElement.clientHeight;
    const below = viewport - box.bottom - gap;
    const above = box.top - gap;
    list.style.setProperty("position", "fixed");
    list.style.setProperty("inset", "auto");
    list.style.setProperty("margin", "0");
    list.style.setProperty("box-sizing", "border-box");
    list.style.setProperty("left", `${box.left}px`);
    list.style.setProperty("width", `${box.width}px`);
    list.style.removeProperty("max-height");
    // Prefer below; flip above only if it fits better there.
    const natural = list.getBoundingClientRect().height;
    const flip = natural > below && above > below;
    const room = Math.max(flip ? above : below, 80);
    if (natural > room) list.style.setProperty("max-height", `${room}px`);
    const height = list.getBoundingClientRect().height; // after max-height
    list.style.setProperty("top", `${flip ? box.top - gap - height : box.bottom + gap}px`);
    list.dataset.placement = flip ? "above" : "below";
  }

  disconnectedCallback() {
    this.#float(false);
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
    return this.#list
      ? [...this.#list.querySelectorAll('option, [role="option"]')].filter((option) => option !== this.#more)
      : [];
  }

  /**
   * Whether the source has more results for the current query.
   * @type {boolean}
   * @readonly
   */
  get hasMore() {
    return this.#next !== null;
  }

  /**
   * Load the next page of results for the current query (what scrolling to
   * the end of the list does). Resolves when it's appended.
   * @returns {Promise<void>}
   */
  loadMore() {
    return this.#loadMore();
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
   * The chosen option as a list (0 or 1 items), like a select's.
   * @type {Element[]}
   * @readonly
   */
  get selectedOptions() {
    return this.#selected && this.options.includes(this.#selected) ? [this.#selected] : [];
  }

  /**
   * Index of the chosen option among the options now in the list, or -1.
   * Setting it chooses that option (-1 clears the value). Script changes
   * don't fire events.
   * @type {number}
   */
  get selectedIndex() {
    return this.#selected ? this.options.indexOf(this.#selected) : -1;
  }
  set selectedIndex(index) {
    const option = this.options[Number(index)];
    if (option) this.#choose(option, { user: false });
    else this.value = "";
  }

  /**
   * Number of options now in the list.
   * @type {number}
   * @readonly
   */
  get length() {
    return this.options.length;
  }

  /**
   * The option at `index` in the list.
   * @param {number} index
   * @returns {Element | null}
   */
  item(index) {
    return this.options[index] ?? null;
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
   * To page results, return `{ options, next, total? }`: `next` is the
   * cursor passed back as `cursor` for the following page (null when
   * there are no more).
   * @type {((query: string, init: { signal: AbortSignal, cursor: string }) => unknown) | null}
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
    input.id ||= `infinite-combo-box-input-${++uid}`;
    if (this.hasAttribute("placeholder")) input.placeholder = this.getAttribute("placeholder");

    this.#list = document.createElement("div");
    this.#list.setAttribute("role", "listbox");
    this.#list.id = `infinite-combo-box-list-${++uid}`;
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
      if (option && option === this.#more) {
        this.#loadMore({ activateFirst: true });
        return;
      }
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
      for (const label of this.#observedLabels) label.id ||= `infinite-combo-box-label-${++uid}`;
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
      this.#internals.setValidity({ valueMissing: true }, valueMissingText(), this.#input);
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
  // A page: { options, next, total }. A plain result is one final page; an
  // object with `options` (or `items`) can carry `next` and `total`; HTML
  // can carry them on an element with data-next / data-total.
  #toPage(result) {
    if (result && typeof result === "object" && !(result instanceof Node) && !Array.isArray(result) &&
        ("options" in result || "items" in result)) {
      return {
        options: this.#toOptions(result.options ?? result.items),
        next: result.next ?? null,
        total: Number.isFinite(result.total) ? result.total : null,
      };
    }
    let fragment = null;
    if (typeof result === "string") {
      const template = document.createElement("template");
      template.innerHTML = result;
      fragment = template.content;
    } else if (result instanceof DocumentFragment) {
      fragment = result;
    }
    let next = null;
    let total = null;
    const marker = fragment?.querySelector("[data-next], [data-total]");
    if (marker) {
      next = marker.getAttribute("data-next") || null;
      total = marker.hasAttribute("data-total") ? Number(marker.getAttribute("data-total")) : null;
      marker.remove();
    }
    return { options: this.#toOptions(fragment ?? result), next, total };
  }

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

  #render(options, { append = false } = {}) {
    if (!append) {
      this.#list.replaceChildren();
      this.#lastGroup = null;
    }
    this.#more?.remove();
    this.#list.append(...options);
    for (const option of options) {
      if (!option.hasAttribute("role")) option.setAttribute("role", "option");
      option.id ||= `infinite-combo-box-option-${++uid}`;
      const selected = this.#value !== "" && this.#valueOf(option) === this.#value;
      if (selected) this.#selected = option;
      setAttr(option, "aria-selected", String(selected));
      if (option.localName === "option") option.selected = selected;
      if (this.#isDisabled(option)) setAttr(option, "aria-disabled", "true");
      // Re-create local <optgroup> headings as presentation-only labels.
      if (option.dataset.group && option.dataset.group !== this.#lastGroup) {
        this.#lastGroup = option.dataset.group;
        const heading = document.createElement("div");
        heading.setAttribute("role", "presentation");
        heading.dataset.groupLabel = "";
        heading.textContent = this.#lastGroup;
        option.before(heading);
      }
    }
    // Positions: known total -> setsize; more pages of unknown size -> -1.
    const all = this.options;
    const setsize = this.#total ?? (this.#next !== null ? -1 : null);
    all.forEach((option, i) => {
      if (setsize === null) {
        option.removeAttribute("aria-setsize");
        option.removeAttribute("aria-posinset");
      } else {
        setAttr(option, "aria-setsize", String(setsize));
        setAttr(option, "aria-posinset", String(i + 1));
      }
    });
    if (this.#next !== null) this.#list.append(this.#moreOption());
    if (!append) this.#setActive(null);
    if (this.#floating) this.#place(); // the list's height changed
  }

  // The last item while more pages exist: an option (so keyboard and
  // screen-reader users reach it like any other) that loads the next page
  // when it's scrolled into view, arrowed onto, or chosen.
  #moreOption() {
    if (!this.#more) {
      this.#more = document.createElement("div");
      this.#more.setAttribute("role", "option");
      this.#more.id = `infinite-combo-box-more-${++uid}`;
      this.#more.dataset.loadMore = "";
      this.#more.setAttribute("aria-selected", "false");
      this.#more.textContent = this.#t("loadMore");
      this.#moreObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && !this.#list.hidden) this.#loadMore();
        },
        { root: this.#list, rootMargin: "0px 0px 48px 0px" },
      );
      this.#moreObserver.observe(this.#more);
    }
    return this.#more;
  }

  async #loadMore({ activateFirst = false } = {}) {
    if (this.#next === null || this.#loadingMore) return;
    const controller = this.#abort;
    const signal = controller?.signal;
    if (!signal || signal.aborted) return;
    this.#loadingMore = true;
    this.#setBusy(true, { announce: false });
    this.#announce(this.#t("loadingMore"));
    let page;
    try {
      page = this.#localMatches ? this.#localPage(this.#next) : await this.#remotePage(this.#query, this.#next, signal);
    } catch (error) {
      this.#loadingMore = false;
      if (signal.aborted) return;
      this.#setBusy(false);
      this.#announce(this.#t("loadMoreFailed"));
      this.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) }));
      return;
    }
    this.#loadingMore = false;
    if (signal.aborted || controller !== this.#abort) return; // a newer search took over
    this.#setBusy(false);
    this.#next = page.next;
    if (page.total !== null) this.#total = page.total;
    const wasOnMore = this.#active === this.#more;
    this.#render(page.options, { append: true });
    if ((activateFirst || wasOnMore) && page.options.length) this.#setActive(page.options[0]);
    else if (wasOnMore) this.#setActive(this.options.at(-1) ?? null);
    const count = page.options.length;
    this.#announce(
      this.#total !== null
        ? this.#t("loadedMoreOfTotal", { count, shown: this.options.length, total: this.#total })
        : this.#t("loadedMore", { count }),
    );
  }

  // Local paging (page-size): the cursor is an offset into the matches.
  #localPage(cursor) {
    const size = this.#pageSize();
    const start = Number(cursor) || 0;
    const slice = this.#localMatches.slice(start, start + size);
    const end = start + slice.length;
    return {
      options: slice.map((option) => option.cloneNode(true)),
      next: end < this.#localMatches.length ? String(end) : null,
      total: this.#localMatches.length,
    };
  }

  #pageSize() {
    const size = Number.parseInt(this.getAttribute("page-size") ?? "", 10);
    return size > 0 ? size : Infinity;
  }

  async #remotePage(query, cursor, signal) {
    return this.#toPage(
      this.#searchFunction
        ? await this.#searchFunction(query, { signal, cursor })
        : await this.#fetch(query, signal, cursor),
    );
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
    this.#query = query;
    this.#next = null;
    this.#total = null;
    this.#localMatches = null;
    this.#loadingMore = false;
    let page;
    if (this.#searchFunction || this.src) {
      if (!query && this.#source.length) {
        page = { options: this.#source.map((option) => option.cloneNode(true)), next: null, total: null };
      } else {
        this.#setBusy(true);
        try {
          page = await this.#remotePage(query, "", signal);
        } catch (error) {
          if (signal.aborted) return;
          this.#setBusy(false);
          this.#announce(this.#t("loadFailed"));
          this.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) }));
          return;
        }
        if (signal.aborted) return; // superseded by a newer search
        this.#setBusy(false);
      }
    } else {
      const needle = query.trim().toLowerCase();
      this.#localMatches = this.#source.filter(
        (option) => !needle || this.#labelOf(option).toLowerCase().includes(needle),
      );
      page = this.#localPage(0);
      if (page.next === null) page.total = null; // everything is shown; no positions needed
    }
    this.#next = page.next;
    this.#total = page.total;
    this.#render(page.options);
    const shown = page.options.length;
    this.#announce(
      !shown
        ? this.#t("noResults")
        : this.#total !== null
          ? this.#t("shownOfTotal", { shown, total: this.#total })
          : this.#t(this.#next !== null ? "availableMore" : "available", { count: shown }),
    );
    this.#setOpen(shown > 0 || Boolean(query));
  }

  async #fetch(query, signal, cursor = "") {
    const template = this.src;
    const filled = template
      .replaceAll("{query}", encodeURIComponent(query))
      .replaceAll("{cursor}", encodeURIComponent(cursor));
    const url = new URL(filled, document.baseURI);
    if (!template.includes("{query}")) url.searchParams.set("q", query);
    if (cursor && !template.includes("{cursor}")) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, { signal, headers: { accept: "application/json, text/html;q=0.9" } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const type = response.headers.get("content-type") ?? "";
    return type.includes("json") ? response.json() : response.text();
  }

  #setBusy(busy, { announce = true } = {}) {
    setAttr(this.#list, "aria-busy", String(busy));
    try {
      if (busy) this.#internals.states.add("loading");
      else this.#internals.states.delete("loading");
    } catch {
      // CustomStateSet unsupported: aria-busy is still set.
    }
    if (busy && announce) this.#announce(this.#t("loading"));
  }

  // --- strings ---------------------------------------------------------------
  #strings = null;

  /**
   * The strings this element shows and announces (see DEFAULT_STRINGS).
   * Setting it merges your values over the defaults, so you only pass the
   * ones you change.
   * @type {Record<string, string | Record<string, string>>}
   */
  get strings() {
    return { ...DEFAULT_STRINGS, ...this.#authoredStrings(), ...this.#strings };
  }
  set strings(value) {
    this.#strings = { ...value };
    if (this.#more) this.#more.textContent = this.#t("loadMore");
  }

  // A <script type="application/json" data-strings> child: inert, so it
  // works under any Content-Security-Policy.
  #authoredStrings() {
    const script = this.querySelector(':scope > script[type="application/json"][data-strings]');
    if (!script) return {};
    try {
      return JSON.parse(script.textContent);
    } catch {
      return {};
    }
  }

  #language() {
    return this.closest("[lang]")?.lang || navigator.language || "en";
  }

  #t(key, values = {}) {
    let template = this.strings[key] ?? DEFAULT_STRINGS[key] ?? key;
    const language = this.#language();
    if (template && typeof template === "object") {
      let category = "other";
      try {
        category = new Intl.PluralRules(language).select(values.count ?? 0);
      } catch {
        // unknown language tag: use "other"
      }
      template = template[category] ?? template.other ?? Object.values(template)[0] ?? "";
    }
    let format = (n) => String(n);
    try {
      const numbers = new Intl.NumberFormat(language);
      format = (n) => numbers.format(n);
    } catch {
      // keep plain numbers
    }
    return String(template).replace(/\{(\w+)\}/g, (match, name) =>
      name in values ? (typeof values[name] === "number" ? format(values[name]) : String(values[name])) : match,
    );
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
    this.#float(open);
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
    if (this.#next !== null && this.#more) enabled.push(this.#more);
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
        if (this.#active === this.#more) this.#loadMore(); // arrowing to the end loads more
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
        if (this.open && this.#active === this.#more) {
          event.preventDefault();
          this.#loadMore({ activateFirst: true });
          return;
        }
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
