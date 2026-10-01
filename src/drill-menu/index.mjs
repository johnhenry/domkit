// <drill-menu>: a list of items where activating one "drills in" to its
// screen (the <template> inside it), and Back returns to the list -- the
// settings-menu / wizard pattern. Light DOM throughout, so ordinary CSS
// styles everything. See readme.md.
//
//   <drill-menu sync-hash>
//     <button data-key="profile">Profile
//       <template><h2>Profile</h2>… <button data-back>Back</button></template>
//     </button>
//     <a href="/logout">Log out</a>          <- a leaf: behaves as itself
//   </drill-menu>

let uid = 0;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/**
 * A menu whose items drill into screens (each item's `<template>`), with
 * roving keyboard focus, Back via Esc/`data-back`/commands, focus
 * restoration, and optional `location.hash` sync.
 *
 * @tag drill-menu
 * @summary A list that drills into sub-screens and back.
 *
 * @attr {string} screen - Key of the screen currently shown (absent = the list). Reflects; set it to navigate.
 * @attr {boolean} sync-hash - Mirror the current screen in `location.hash`, so links and the browser's Back button work.
 *
 * @fires push - A screen was shown. `event.detail` is `{ key, item }`.
 * @fires pop - The menu returned to the list. `event.detail` is `{ key, item }` for the screen that closed.
 */
export default class DrillMenu extends HTMLElement {
  static observedAttributes = ["screen"];

  #screenElement = null;
  #shown = null; // the screen element currently showing
  #invalidHandled = false;
  #hid = new Set();
  #current = null; // the item whose screen is open
  #reflecting = false;
  #fromHashHistory = false; // our own hash entry is on the history stack
  #onHashChange = () => this.#syncFromHash();

  constructor() {
    super();
    this.addEventListener("click", (event) => this.#onClick(event));
    this.addEventListener("keydown", (event) => this.#onKeyDown(event));
    // Form validation: an invalid field inside a hidden live screen can't
    // be focused or shown, so open its screen first (`invalid` fires before
    // the browser looks for the first invalid control to focus).
    this.addEventListener(
      "invalid",
      (event) => {
        const live = event.target instanceof Element ? event.target.closest("[data-screen]") : null;
        if (!live || live.parentElement !== this || !live.hidden || this.#shown === live) return;
        const item = this.items.find((candidate) => this.#keyOf(candidate) === live.dataset.screen);
        if (item && !this.#invalidHandled) {
          this.#invalidHandled = true; // only the first invalid field wins
          queueMicrotask(() => (this.#invalidHandled = false));
          this.push(this.#keyOf(item), { focus: false });
        }
      },
      true,
    );
    this.addEventListener("command", (event) => {
      if (event.command === "--back") this.pop();
      else if (event.command === "--push") this.push(event.source?.value ?? "");
    });
  }

  connectedCallback() {
    if (!this.#screenElement) {
      this.#screenElement = document.createElement("div");
      this.#screenElement.dataset.drillScreen = "";
      this.#screenElement.tabIndex = -1;
      this.#screenElement.setAttribute("role", "region");
      this.#screenElement.hidden = true;
      this.append(this.#screenElement);
    }
    // Live screens start hidden (before upgrade they're readable content).
    for (const live of this.querySelectorAll(":scope > [data-screen]")) {
      if (live !== this.#shown) live.hidden = true;
    }
    this.#rove(this.items.find((item) => item.tabIndex === 0) ?? this.items[0]);
    if (this.syncHash) {
      window.addEventListener("hashchange", this.#onHashChange);
      this.#syncFromHash();
    }
    const initial = this.getAttribute("screen");
    if (initial && !this.#current) this.push(initial, { focus: false });
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this.#onHashChange);
  }

  attributeChangedCallback(name, previous, current) {
    if (this.#reflecting || !this.#screenElement) return;
    if (current === null) this.pop({ focus: false });
    else if (current !== previous) this.push(current, { focus: false });
  }

  /**
   * The items: element children other than templates and the screen.
   * @type {Element[]}
   * @readonly
   */
  get items() {
    return [...this.children].filter(
      (child) =>
        child.localName !== "template" && child !== this.#screenElement && !child.hasAttribute("data-screen"),
    );
  }

  /**
   * Key of the open screen, or null. Setting it navigates.
   * @type {string | null}
   */
  get screen() {
    return this.getAttribute("screen");
  }
  set screen(key) {
    if (key === null || key === undefined || key === "") this.removeAttribute("screen");
    else this.setAttribute("screen", String(key));
  }

  /** @type {boolean} */
  get syncHash() {
    return this.hasAttribute("sync-hash");
  }
  set syncHash(value) {
    this.toggleAttribute("sync-hash", Boolean(value));
  }

  /**
   * Show the screen of the item with this key (its `data-key`, or its
   * position). Items without a template are leaves and can't be pushed.
   * @param {string | number} key
   * @param {{ focus?: boolean }} [options]
   * @returns {boolean} whether a screen was shown
   */
  push(key, { focus = true } = {}) {
    const item = this.#itemFor(String(key));
    if (!item || !this.#hasScreen(item)) return false;
    if (this.#current === item) return true;
    // Switching screens directly: the old one pops (with its event), but
    // the attribute and hash go straight to the new key.
    if (this.#current) this.#close({ focus: false, switching: true });
    this.#current = item;
    // A live <… data-screen="key"> child is shown in place (its state, like
    // form values, persists); otherwise the item's <template> is cloned
    // into the generated screen container.
    const live = this.#liveScreenOf(item);
    const screen = live ?? this.#screenElement;
    if (live) {
      if (!live.hasAttribute("role")) live.setAttribute("role", "region");
      if (!live.hasAttribute("tabindex")) live.tabIndex = -1;
    } else {
      screen.replaceChildren(this.#templateOf(item).content.cloneNode(true));
    }
    if (!live || !(live.hasAttribute("aria-label") || live.hasAttribute("aria-labelledby"))) {
      screen.setAttribute("aria-label", this.#labelOf(item));
    }
    this.#shown = screen;
    for (const other of this.items) {
      if (!other.hidden) {
        other.hidden = true;
        this.#hid.add(other);
      }
    }
    screen.hidden = false;
    item.setAttribute("aria-expanded", "true");
    const keyName = this.#keyOf(item);
    this.#reflect(keyName);
    if (this.syncHash && location.hash !== `#${keyName}`) {
      location.hash = keyName;
      this.#fromHashHistory = true;
    }
    if (focus) (screen.querySelector(FOCUSABLE) ?? screen).focus();
    this.dispatchEvent(new CustomEvent("push", { bubbles: true, detail: { key: keyName, item } }));
    return true;
  }

  /**
   * Return to the list, restoring focus to the item that opened the screen.
   * @param {{ focus?: boolean }} [options]
   */
  pop({ focus = true } = {}) {
    if (!this.#current) return;
    if (this.syncHash && this.#fromHashHistory && location.hash === `#${this.#keyOf(this.#current)}`) {
      // Our own hash entry is on the history stack: going back pops it, and
      // the hashchange that follows closes the screen (focus included).
      this.#fromHashHistory = false;
      this.#focusAfterHashPop = focus;
      history.back();
      return;
    }
    this.#close({ focus });
  }
  #focusAfterHashPop = false;

  #close({ focus, switching = false }) {
    const item = this.#current;
    const screen = this.#shown;
    const hadFocus = this.contains(document.activeElement);
    this.#current = null;
    this.#shown = null;
    if (screen === this.#screenElement) {
      screen.replaceChildren();
      screen.removeAttribute("aria-label");
    }
    screen.hidden = true;
    // Unhide only what push() hid, not items the author hid.
    for (const other of this.#hid) other.hidden = false;
    this.#hid.clear();
    item.setAttribute("aria-expanded", "false");
    if (!switching) this.#reflect(null);
    if (this.syncHash && !switching && location.hash === `#${this.#keyOf(item)}`) {
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    if (!switching && (focus || hadFocus)) {
      this.#rove(item);
      item.focus();
    }
    this.dispatchEvent(new CustomEvent("pop", { bubbles: true, detail: { key: this.#keyOf(item), item } }));
  }

  #syncFromHash() {
    const key = decodeURIComponent(location.hash.slice(1));
    const item = key ? this.#itemFor(key) : null;
    if (item && this.#hasScreen(item)) {
      this.push(key, { focus: false });
    } else if (this.#current) {
      const focus = this.#focusAfterHashPop;
      this.#focusAfterHashPop = false;
      this.#close({ focus });
    }
  }

  #reflect(key) {
    this.#reflecting = true;
    if (key === null) this.removeAttribute("screen");
    else this.setAttribute("screen", key);
    this.#reflecting = false;
  }

  #liveScreenOf(item) {
    const key = this.#keyOf(item);
    return [...this.children].find((child) => child.getAttribute("data-screen") === key) ?? null;
  }

  #hasScreen(item) {
    return Boolean(this.#templateOf(item) || this.#liveScreenOf(item));
  }

  #templateOf(item) {
    return item.querySelector(":scope > template");
  }

  #keyOf(item) {
    return item.dataset.key ?? String(this.items.indexOf(item));
  }

  #labelOf(item) {
    return (item.getAttribute("aria-label") ?? item.textContent).trim();
  }

  #itemFor(key) {
    const items = this.items;
    return items.find((item) => item.dataset.key === key) ?? (/^\d+$/.test(key) ? items[Number(key)] : undefined);
  }

  #ownItem(target) {
    if (!(target instanceof Element)) return null;
    const item = this.items.find((candidate) => candidate === target || candidate.contains(target));
    return item && target.closest("drill-menu") === this ? item : null;
  }

  // Roving tabindex: one tab stop for the whole list.
  #rove(active) {
    for (const item of this.items) {
      item.tabIndex = item === active ? 0 : -1;
      if (this.#hasScreen(item)) {
        const live = this.#liveScreenOf(item);
        if (live) {
          live.id ||= `drill-menu-screen-${++uid}`;
          item.setAttribute("aria-controls", live.id);
        }
        if (!item.hasAttribute("aria-expanded")) item.setAttribute("aria-expanded", "false");
        item.id ||= `drill-menu-item-${++uid}`;
      }
      // Non-button items get button semantics so they're operable.
      if (!["button", "a", "summary"].includes(item.localName) && !item.hasAttribute("role")) {
        item.setAttribute("role", "button");
      }
    }
  }

  #onClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest("drill-menu") !== this) return;
    if (this.#shown?.contains(target) && target.closest("[data-back]")) {
      event.preventDefault();
      this.pop();
      return;
    }
    const item = this.#ownItem(target);
    if (item && this.#hasScreen(item)) {
      event.preventDefault(); // an <a> item with a screen drills in instead of navigating
      this.#rove(item);
      this.push(this.#keyOf(item));
    }
  }

  #onKeyDown(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest("drill-menu") !== this || event.altKey || event.ctrlKey || event.metaKey) return;
    if (this.#shown?.contains(target)) {
      if (event.key === "Escape" && this.#current) {
        event.preventDefault();
        this.pop();
      }
      return;
    }
    const item = this.#ownItem(target);
    if (!item || item !== target) return;
    const items = this.items.filter((candidate) => !candidate.hidden && !candidate.hasAttribute("disabled"));
    const index = items.indexOf(item);
    let next;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = items[(index + 1) % items.length];
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = items[(index - 1 + items.length) % items.length];
        break;
      case "Home":
        next = items[0];
        break;
      case "End":
        next = items[items.length - 1];
        break;
      case "Enter":
      case " ":
        // Native buttons/links activate themselves; role="button" items don't.
        if (item.getAttribute("role") === "button") {
          event.preventDefault();
          item.click();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    this.#rove(next);
    next.focus();
  }
}
