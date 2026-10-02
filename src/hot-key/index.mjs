// <hot-key>: toggle the <dialog> or popover inside it with a keyboard
// shortcut, or run an invoker command (`commandfor` + `command`, like a
// button) on any element. A dialog stays a real, native <dialog>: its own
// `open`, `close` event, `returnValue`, focus handling, `::backdrop`, and
// the `closedby` attribute all work as usual. `closedby="any"` (light
// dismiss) and `closedby="none"` (no Esc) are polyfilled where the browser
// doesn't support the attribute yet. See readme.md.

import { invokeCommand, commandForElement } from "../invoke-command.mjs";

const MODIFIERS = ["ctrl", "alt", "shift", "meta"];
const IS_MAC = /mac|iphone|ipad|ipod/i.test(globalThis.navigator?.platform ?? "");
const NATIVE_CLOSEDBY = "closedBy" in (globalThis.HTMLDialogElement?.prototype ?? {});

// "mod+shift+k  /" -> [{ key: "k", ctrl: !mac, meta: mac, shift: true, alt: false }, { key: "/" … }]
const parseHotkeys = (text) =>
  (text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((combo) => {
      const parts = combo.toLowerCase().split("+");
      const key = parts.pop() || "+"; // "ctrl++" -> the + key
      const shortcut = { key, ctrl: false, alt: false, shift: false, meta: false };
      for (const part of parts) {
        if (part === "mod") shortcut[IS_MAC ? "meta" : "ctrl"] = true;
        else if (part === "control") shortcut.ctrl = true;
        else if (part === "option") shortcut.alt = true;
        else if (part === "cmd" || part === "command") shortcut.meta = true;
        else if (MODIFIERS.includes(part)) shortcut[part] = true;
      }
      return shortcut;
    });

const KEY_ALIASES = { esc: "escape", space: " ", spacebar: " " };

const matches = (shortcut, event) => {
  const key = KEY_ALIASES[shortcut.key] ?? shortcut.key;
  const pressed = event.key.toLowerCase();
  // Shift changes event.key for symbols ("?" vs "/"), so when the shortcut
  // names a symbol, don't also demand an exact shift match.
  const symbol = key.length === 1 && !/[a-z0-9]/.test(key);
  return (
    pressed === key &&
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.metaKey === shortcut.meta &&
    (symbol || event.shiftKey === shortcut.shift)
  );
};

const isPopover = (element) => element?.hasAttribute("popover") ?? false;

const isEditable = (element) =>
  element instanceof Element &&
  (element.isContentEditable ||
    element.closest("input, textarea, select, [contenteditable='' i], [contenteditable='true' i]") !== null);

/**
 * Opens and closes the `<dialog>` or popover inside it with a keyboard
 * shortcut, keeping it fully native, or runs an invoker command on any
 * element. Polyfills `closedby="any"`/`"none"` on dialogs.
 *
 * @tag hot-key
 * @summary Toggle a native dialog or popover, or run an invoker command, with a keyboard shortcut.
 *
 * @attr {string} hotkey - One or more space-separated shortcuts, e.g. `mod+k /`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere.
 * @attr {string} commandfor - The id of an element to send `command` to, as on a `<button>`. Without it, the shortcut toggles the `<dialog>` or popover inside.
 * @attr {string} command - With `commandfor`: the command to run, a built-in one (`show-modal`, `close`, `request-close`, `show-popover`, `hide-popover`, `toggle-popover`) or a custom `--name` (dispatched as a `command` event).
 * @attr {boolean} non-modal - Open a dialog with `show()` instead of `showModal()`.
 * @attr {boolean} disabled - The shortcut does nothing. The dialog or popover itself is unaffected.
 */
export default class HotKey extends HTMLElement {
  static observedAttributes = ["hotkey"];

  #shortcuts = [];
  #onKeyDown = (event) => this.#handleKey(event);
  #onPointerDown = (event) => this.#pointerStart = this.#outside(event);
  #pointerStart = false;
  #onClick = (event) => this.#handleClick(event);
  #onCancel = (event) => {
    if (!NATIVE_CLOSEDBY && this.dialog?.getAttribute("closedby") === "none") event.preventDefault();
  };
  #bound = null;

  connectedCallback() {
    document.addEventListener("keydown", this.#onKeyDown);
    this.#bindDialog();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);
    this.#bindDialog(null);
  }

  attributeChangedCallback() {
    this.#shortcuts = parseHotkeys(this.getAttribute("hotkey"));
  }

  /**
   * The `<dialog>` or popover this element opens and closes: its first
   * `<dialog>` or `[popover]` descendant.
   * @type {HTMLElement | null}
   * @readonly
   */
  get target() {
    return this.querySelector("dialog, [popover]");
  }

  /**
   * The `<dialog>` this element controls, if its target is one.
   * @type {HTMLDialogElement | null}
   * @readonly
   */
  get dialog() {
    const target = this.target;
    return target instanceof HTMLDialogElement ? target : null;
  }

  /** @type {string} */
  get command() {
    return this.getAttribute("command") ?? "";
  }
  set command(value) {
    this.setAttribute("command", value);
  }

  /**
   * The element `commandfor` names, like a button's `commandForElement`.
   * @type {Element | null}
   */
  get commandForElement() {
    return commandForElement(this);
  }
  set commandForElement(element) {
    if (element?.id) this.setAttribute("commandfor", element.id);
    else this.removeAttribute("commandfor");
  }

  /** @type {string} */
  get hotkey() {
    return this.getAttribute("hotkey") ?? "";
  }
  set hotkey(value) {
    this.setAttribute("hotkey", value);
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

  /** @type {boolean} */
  get nonModal() {
    return this.hasAttribute("non-modal");
  }
  set nonModal(value) {
    this.toggleAttribute("non-modal", Boolean(value));
  }

  /**
   * Whether the dialog or popover is open.
   * @type {boolean}
   * @readonly
   */
  get open() {
    const target = this.target;
    if (!target) return false;
    return isPopover(target) ? target.matches(":popover-open") : target.open;
  }

  /** Open the dialog (modally, unless `non-modal`) or popover. */
  show() {
    const target = this.target;
    if (!target || this.open) return;
    if (isPopover(target)) return target.showPopover();
    this.#bindDialog();
    if (this.nonModal) target.show();
    else target.showModal();
  }

  /**
   * Close the dialog or popover.
   * @param {string} [returnValue] for a dialog
   */
  close(returnValue) {
    const target = this.target;
    if (!target || !this.open) return;
    if (isPopover(target)) target.hidePopover();
    else target.close(returnValue);
  }

  /** Open the dialog or popover if it's closed, close it if it's open. */
  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  /**
   * Run `command` on the `commandfor` element, as a button would. Returns
   * false if there's no such element or command.
   * @returns {boolean}
   */
  runCommand() {
    return invokeCommand(this.commandForElement, this.command, this);
  }

  // Listen on the current dialog (it may be swapped out after connect).
  // Popovers need nothing: light dismiss and Esc are native.
  #bindDialog(dialog = this.dialog) {
    if (this.#bound === dialog) return;
    if (this.#bound) {
      this.#bound.removeEventListener("pointerdown", this.#onPointerDown);
      this.#bound.removeEventListener("click", this.#onClick);
      this.#bound.removeEventListener("cancel", this.#onCancel);
    }
    this.#bound = dialog;
    if (dialog) {
      dialog.addEventListener("pointerdown", this.#onPointerDown);
      dialog.addEventListener("click", this.#onClick);
      dialog.addEventListener("cancel", this.#onCancel);
    }
  }

  #handleKey(event) {
    if (this.disabled) return;
    if (event.defaultPrevented || event.repeat || !this.#shortcuts.length) return;
    const shortcut = this.#shortcuts.find((s) => matches(s, event));
    if (!shortcut) return;
    // A bare key ("/", "?") shouldn't fire while someone is typing.
    const bare = !shortcut.ctrl && !shortcut.alt && !shortcut.meta;
    if (bare && isEditable(event.target) && !this.target?.contains(event.target)) return;
    if (this.hasAttribute("commandfor")) {
      if (this.runCommand()) event.preventDefault();
      return;
    }
    if (!this.target) return;
    event.preventDefault();
    this.toggle();
  }

  // closedby="any" polyfill: a click that both starts and ends outside the
  // dialog's box (i.e. on the backdrop) closes it. Not needed where the
  // browser implements closedby natively.
  #outside(event) {
    const dialog = this.dialog;
    if (!dialog?.open || event.target !== dialog) return false;
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  }

  #handleClick(event) {
    const dialog = this.dialog;
    if (NATIVE_CLOSEDBY || dialog?.getAttribute("closedby") !== "any") return;
    if (this.#pointerStart && this.#outside(event)) dialog.close();
    this.#pointerStart = false;
  }
}
