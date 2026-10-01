// <tabbed-ui>: the WAI-ARIA tabs pattern over plain children.
// https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
//
//   <tabbed-ui>
//     <div>                 <- the tab list: a child with role="tablist",
//       <button>One</button>   or else the first element child
//       <button>Two</button>
//     </div>
//     <section>…</section>  <- panels: the remaining element children,
//     <section>…</section>     matched to tabs by position
//   </tabbed-ui>
//
// Before upgrade (or without JS) every panel is visible, so the content is
// always readable. See readme.md for the full contract.

let uid = 0;
const nextId = (prefix) => `${prefix}-${++uid}`;

/**
 * Tabs and panels from plain children, following the WAI-ARIA tabs
 * pattern: roles, ids, roving tabindex, and keyboard support are wired
 * onto whatever markup you write.
 *
 * @tag tabbed-ui
 * @summary Accessible tabs and panels from plain children.
 *
 * @attr {number} selected-index - Index of the selected tab. Reflects the current selection.
 * @attr {boolean} manual - Arrow keys move focus only; Enter/Space selects (manual activation).
 *
 * @fires change - The user selected a different tab (click or keyboard). Not fired for script changes.
 *
 * @cssprop --domkit-tab-gap - Space between tabs (index.css).
 * @cssprop --domkit-tab-padding - Padding inside each tab (index.css).
 * @cssprop --domkit-tab-accent - Color of the selected-tab indicator and focus ring (index.css).
 * @cssprop --domkit-tab-border - Color of the line under the tab list (index.css).
 */
export default class TabbedUI extends HTMLElement {
  static observedAttributes = ["selected-index", "manual"];

  #observer = new MutationObserver(() => this.#sync());
  #index = -1;
  #syncing = false;

  constructor() {
    super();
    this.addEventListener("click", (event) => this.#onClick(event));
    this.addEventListener("keydown", (event) => this.#onKeyDown(event));
  }

  connectedCallback() {
    this.#sync();
    // Watch our own children (panels added/removed) and the tab list's
    // (tabs added/removed); re-observed by #sync if the tab list changes.
    this.#observe();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback(name, previous, current) {
    if (name === "selected-index" && current !== previous && !this.#syncing) {
      this.#select(Number(current), { user: false });
    }
  }

  /**
   * The tab list: the child with role="tablist", else the first element child.
   * @type {Element | null}
   * @readonly
   */
  get tabList() {
    const children = [...this.children];
    return (
      children.find((child) => child.getAttribute("role") === "tablist") ??
      children[0] ??
      null
    );
  }

  /**
   * The tabs, in order.
   * @type {Element[]}
   * @readonly
   */
  get tabs() {
    return this.tabList ? [...this.tabList.children] : [];
  }

  /**
   * The panels, in order (every element child except the tab list).
   * @type {Element[]}
   * @readonly
   */
  get panels() {
    const tabList = this.tabList;
    return [...this.children].filter((child) => child !== tabList);
  }

  /**
   * Index of the selected tab. Setting it does not fire `change`.
   * @type {number}
   */
  get selectedIndex() {
    return this.#index;
  }
  set selectedIndex(value) {
    this.#select(Number(value), { user: false });
  }

  /**
   * With `manual`, arrow keys move focus and Enter/Space selects.
   * @type {boolean}
   */
  get manual() {
    return this.hasAttribute("manual");
  }
  set manual(value) {
    this.toggleAttribute("manual", Boolean(value));
  }

  #observe() {
    this.#observer.disconnect();
    if (!this.isConnected) {
      return;
    }
    this.#observer.observe(this, { childList: true });
    if (this.tabList) {
      this.#observer.observe(this.tabList, { childList: true });
    }
  }

  // (Re)apply roles, ids, and wiring to whatever children exist now.
  #sync() {
    const tabList = this.tabList;
    if (!tabList) {
      return;
    }
    if (!tabList.hasAttribute("role")) {
      tabList.setAttribute("role", "tablist");
    }
    const tabs = this.tabs;
    const panels = this.panels;
    tabs.forEach((tab, i) => {
      const panel = panels[i];
      if (!tab.hasAttribute("role")) tab.setAttribute("role", "tab");
      tab.id ||= nextId("tabbed-ui-tab");
      if (panel) {
        if (!panel.hasAttribute("role")) panel.setAttribute("role", "tabpanel");
        panel.id ||= nextId("tabbed-ui-panel");
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", tab.id);
        // Focusable so keyboard users can reach a panel with no focusable
        // content; authors who don't want that can set their own tabindex.
        if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "0");
      }
    });
    // Initial selection: the attribute, else an authored aria-selected tab,
    // else the current selection (kept across mutations), else the first.
    let index = this.#index;
    if (index < 0) {
      const fromAttribute = this.getAttribute("selected-index");
      const authored = tabs.findIndex(
        (tab) => tab.getAttribute("aria-selected") === "true",
      );
      index = fromAttribute !== null ? Number(fromAttribute) : Math.max(authored, 0);
    }
    this.#select(index, { user: false, force: true });
    this.#observe();
  }

  #isDisabled(tab) {
    return tab.hasAttribute("disabled") || tab.getAttribute("aria-disabled") === "true";
  }

  #select(index, { user, focus = false, force = false }) {
    const tabs = this.tabs;
    const panels = this.panels;
    if (!tabs.length) {
      return;
    }
    if (!Number.isInteger(index)) index = 0;
    index = Math.min(Math.max(index, 0), tabs.length - 1);
    if (index === this.#index && !force) {
      if (focus) tabs[index].focus();
      return;
    }
    const changed = index !== this.#index;
    this.#index = index;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    this.#syncing = true;
    this.setAttribute("selected-index", String(index));
    this.#syncing = false;
    if (focus) tabs[index].focus();
    if (user && changed) {
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  #tabFor(target) {
    const tabList = this.tabList;
    const tab = target instanceof Element ? target.closest('[role="tab"]') : null;
    return tab && tab.parentElement === tabList ? tab : null;
  }

  #onClick(event) {
    const tab = this.#tabFor(event.target);
    if (tab && !this.#isDisabled(tab)) {
      this.#select(this.tabs.indexOf(tab), { user: true });
    }
  }

  #onKeyDown(event) {
    const tab = this.#tabFor(event.target);
    if (!tab || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const tabs = this.tabs;
    const current = tabs.indexOf(tab);
    const vertical = this.tabList.getAttribute("aria-orientation") === "vertical";
    const step = (from, delta) => {
      for (let i = 1; i <= tabs.length; i++) {
        const next = (from + delta * i + tabs.length * i) % tabs.length;
        if (!this.#isDisabled(tabs[next])) return next;
      }
      return from;
    };
    const firstEnabled = () => step(-1, 1);
    const lastEnabled = () => step(tabs.length, -1);
    let target;
    switch (event.key) {
      case vertical ? "ArrowDown" : "ArrowRight":
        target = step(current, 1);
        break;
      case vertical ? "ArrowUp" : "ArrowLeft":
        target = step(current, -1);
        break;
      case "Home":
        target = firstEnabled();
        break;
      case "End":
        target = lastEnabled();
        break;
      case "Enter":
      case " ":
        // <button> tabs activate through their own click; other elements
        // (e.g. <span role="tab">) need it done here.
        if (tab.localName !== "button" && !this.#isDisabled(tab)) {
          event.preventDefault();
          this.#select(current, { user: true });
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    if (this.manual) {
      tabs[target].focus();
    } else {
      this.#select(target, { user: true, focus: true });
    }
  }
}
