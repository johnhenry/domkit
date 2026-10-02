// <swipe-input>: swipe gestures (touch, pen, or mouse) on the area it
// wraps send invoker commands, like a <button commandfor command> per
// direction. See readme.md.
//
//   <swipe-input commandfor="player" up="--up" down="--down" left="--left" right="--right">
//     <canvas>…</canvas>
//   </swipe-input>
import { invokeCommand, commandForElement } from "../invoke-command.mjs";


/**
 * Turns swipes on the area it wraps into invoker commands, one per
 * direction, sent to the `commandfor` element.
 *
 * @tag swipe-input
 * @summary Swipe gestures that send invoker commands.
 *
 * @attr {string} commandfor - The id of the element to send commands to.
 * @attr {string} up - The command for a swipe up (for example `--up`, or a built-in like `show-popover`).
 * @attr {string} down - The command for a swipe down.
 * @attr {string} left - The command for a swipe left.
 * @attr {string} right - The command for a swipe right.
 * @attr {number} threshold - How far, in CSS pixels, a pointer must travel to count as a swipe. Default 30.
 * @attr {string} pointers - Which pointers swipe: `touch`, `pen`, `mouse`, or a space-separated mix. Default: all of them.
 * @attr {boolean} disabled - Swipes do nothing.
 *
 * @fires swipe - A swipe was recognized, before its command is sent. `detail` is `{ direction, distance }`; cancel it to skip the command. Fired even when that direction has no command.
 */
export default class SwipeInput extends HTMLElement {
  #start = null; // { id, x, y }

  constructor() {
    super();
    // Host defaults only: a block that doesn't scroll or zoom under a
    // finger, so swipes reach it. Page CSS overrides them.
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.append(":host(:not([hidden])) { display: block; touch-action: none; user-select: none; }");
    shadow.append(style, document.createElement("slot"));
    this.addEventListener("pointerdown", (event) => this.#down(event));
    this.addEventListener("pointerup", (event) => this.#up(event));
    this.addEventListener("pointercancel", () => (this.#start = null));
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

  /**
   * The element `commandfor` names.
   * @type {Element | null}
   * @readonly
   */
  get commandForElement() {
    return commandForElement(this);
  }

  #accepts(event) {
    const pointers = (this.getAttribute("pointers") ?? "").trim();
    return !pointers || pointers.split(/\s+/).includes(event.pointerType);
  }

  #down(event) {
    if (this.disabled || !event.isPrimary || !this.#accepts(event)) return;
    this.#start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    // Keep receiving this pointer's events even if the swipe ends outside.
    try {
      this.setPointerCapture(event.pointerId);
    } catch {
      // the pointer is already gone
    }
  }

  #up(event) {
    const start = this.#start;
    this.#start = null;
    if (!start || start.id !== event.pointerId || this.disabled) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    const threshold = Number(this.getAttribute("threshold")) || 30;
    if (distance < threshold) return;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    const swipe = new CustomEvent("swipe", { bubbles: true, cancelable: true, detail: { direction, distance } });
    if (!this.dispatchEvent(swipe)) return;
    invokeCommand(this.commandForElement, this.getAttribute(direction), this);
  }
}

