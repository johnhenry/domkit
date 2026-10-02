// <gamepad-input>: a game controller's buttons send invoker commands, like
// a <button commandfor command> per button. The Gamepad API only reports
// state, so this polls on animation frames while a controller is
// connected and sends a command when a button goes down. See readme.md.
//
//   <gamepad-input commandfor="player" up="--up" down="--down" a="--jump" start="--toggle"></gamepad-input>
import { invokeCommand, commandForElement } from "../invoke-command.mjs";

/** The standard mapping's button names, by index. */
export const BUTTONS = ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "select", "start", "ls", "rs", "up", "down", "left", "right", "home"];
const STICK = 0.5; // how far the left stick must lean to count as a direction

/**
 * Turns a game controller's buttons (and left stick) into invoker
 * commands, sent to the `commandfor` element: one attribute per button,
 * named as in the standard gamepad mapping.
 *
 * @tag gamepad-input
 * @summary Game controller buttons that send invoker commands.
 *
 * @attr {string} commandfor - The id of the element to send commands to.
 * @attr {number} index - Which controller (0 is the first connected). Default: any.
 * @attr {string} up - The command for the d-pad (or left stick) up. Likewise `down`, `left`, and `right`.
 * @attr {string} a - The command for the bottom face button. Likewise `b` (right), `x` (left), `y` (top), `lb`, `rb`, `lt`, `rt`, `select`, `start`, `ls`, `rs`, and `home`.
 * @attr {boolean} disabled - Button presses do nothing.
 *
 * @fires gamepadpress - A button went down, before its command is sent. `detail` is `{ button, gamepad }`; cancel it to skip the command. Fired even when that button has no command.
 */
export default class GamepadInput extends HTMLElement {
  #frame = 0;
  #pressed = new Map(); // gamepad index -> Set of buttons held
  #onConnect = () => this.#poll();

  connectedCallback() {
    addEventListener("gamepadconnected", this.#onConnect);
    this.#poll();
  }

  disconnectedCallback() {
    removeEventListener("gamepadconnected", this.#onConnect);
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#pressed.clear();
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

  #pads() {
    const all = [...(navigator.getGamepads?.() ?? [])].filter(Boolean);
    const index = this.getAttribute("index");
    return index === null ? all : all.filter((pad) => pad.index === Number(index));
  }

  // Poll while connected and a controller is present; stop when none is,
  // and wait for the next `gamepadconnected`.
  #poll() {
    if (this.#frame || !this.isConnected) return;
    const step = () => {
      this.#frame = 0;
      const pads = this.#pads();
      if (!pads.length || !this.isConnected) return;
      for (const pad of pads) this.#read(pad);
      this.#frame = requestAnimationFrame(step);
    };
    step();
  }

  #read(pad) {
    const held = new Set();
    pad.buttons.forEach((button, i) => {
      if (button.pressed && BUTTONS[i]) held.add(BUTTONS[i]);
    });
    const [x = 0, y = 0] = pad.axes;
    if (x <= -STICK) held.add("left");
    if (x >= STICK) held.add("right");
    if (y <= -STICK) held.add("up");
    if (y >= STICK) held.add("down");
    const before = this.#pressed.get(pad.index);
    this.#pressed.set(pad.index, held);
    // The first look at a controller only records what's already held: a
    // press is a button going down while this element is watching.
    if (!before || this.disabled) return;
    for (const button of held) {
      if (before.has(button)) continue; // only on the way down
      const press = new CustomEvent("gamepadpress", { bubbles: true, cancelable: true, detail: { button, gamepad: pad } });
      if (this.dispatchEvent(press)) invokeCommand(this.commandForElement, this.getAttribute(button), this);
    }
  }
}
