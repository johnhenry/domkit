// <hotkey-dialog>: open and close the <dialog> inside it with a keyboard
// shortcut. The dialog stays a real, native <dialog>: its own `open`,
// `close` event, `returnValue`, focus handling, `::backdrop`, and the
// `closedby` attribute all work as usual. `closedby="any"` (light dismiss)
// and `closedby="none"` (no Esc) are polyfilled where the browser doesn't
// support the attribute yet. See readme.md.

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

const isEditable = (element) =>
  element instanceof Element &&
  (element.isContentEditable ||
    element.closest("input, textarea, select, [contenteditable='' i], [contenteditable='true' i]") !== null);

/**
 * Opens and closes the `<dialog>` inside it with a keyboard shortcut,
 * keeping the dialog fully native. Polyfills `closedby="any"`/`"none"`.
 *
 * @tag hotkey-dialog
 * @summary Toggle a native dialog with a keyboard shortcut.
 *
 * @attr {string} hotkey - One or more space-separated shortcuts, e.g. `mod+k /`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere.
 * @attr {boolean} non-modal - Open with `show()` instead of `showModal()`.
 * @attr {boolean} disabled - The shortcut does nothing. The dialog itself is unaffected.
 */
export default class HotkeyDialog extends HTMLElement {
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
   * The `<dialog>` this element controls: its first `<dialog>` descendant.
   * @type {HTMLDialogElement | null}
   * @readonly
   */
  get dialog() {
    return this.querySelector("dialog");
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

  /** Open the dialog (modally, unless `non-modal`). */
  show() {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    this.#bindDialog();
    if (this.nonModal) dialog.show();
    else dialog.showModal();
  }

  /**
   * Close the dialog.
   * @param {string} [returnValue]
   */
  close(returnValue) {
    this.dialog?.close(returnValue);
  }

  /** Open the dialog if it's closed, close it if it's open. */
  toggle() {
    if (this.dialog?.open) this.close();
    else this.show();
  }

  // Listen on the current dialog (it may be swapped out after connect).
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
    if (bare && isEditable(event.target) && !this.dialog?.contains(event.target)) return;
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
