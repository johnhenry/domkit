// Send an invoker command to an element, as a <button commandfor command>
// would: the built-in commands (show-modal, toggle-popover, …) run
// directly, since a synthetic CommandEvent doesn't trigger the browser's
// own behavior, and custom `--commands` are dispatched as a `command`
// event. Shared by <hot-key>, <swipe-input>, and <gamepad-input>.
//
// Without `commandfor`, a custom command bubbles instead: it's dispatched
// on the input itself as a bubbling `command` event, for whatever element
// it's inside to handle. So controls can live inside what they control,
// with no ids:
//
//   <game-player>
//     <hot-key hotkey="arrowup" command="--up"></hot-key>
//   </game-player>

const BUILT_IN = {
  "show-modal": (el) => el instanceof HTMLDialogElement && !el.open && el.showModal(),
  close: (el) => el instanceof HTMLDialogElement && el.close(),
  "request-close": (el) => el instanceof HTMLDialogElement && (el.requestClose ? el.requestClose() : el.close()),
  "show-popover": (el) => el.popover !== null && !el.matches(":popover-open") && el.showPopover(),
  "hide-popover": (el) => el.popover !== null && el.matches(":popover-open") && el.hidePopover(),
  "toggle-popover": (el) => el.popover !== null && el.togglePopover(),
};

/**
 * Run `command` on `target`, with `source` as the event's source. Returns
 * false if there's no target, or the command isn't built in or `--custom`.
 * @param {Element | null | undefined} target
 * @param {string | null | undefined} command
 * @param {Element} source
 * @returns {boolean}
 */
export function invokeCommand(target, command, source) {
  if (!target || !command) return false;
  if (command.startsWith("--")) {
    const event = globalThis.CommandEvent
      ? new CommandEvent("command", { command, source, cancelable: true })
      : Object.assign(new Event("command", { cancelable: true }), { command, source });
    target.dispatchEvent(event);
    return true;
  }
  const run = BUILT_IN[command];
  if (!run) return false;
  run(target);
  return true;
}

/**
 * The element an element's `commandfor` attribute names (by id, in its own
 * document or shadow root), like a button's `commandForElement`.
 * @param {Element} element
 * @returns {Element | null}
 */
export function commandForElement(element) {
  const id = element.getAttribute("commandfor");
  return id ? (element.getRootNode().getElementById?.(id) ?? null) : null;
}

/**
 * Send `command` from an input element: to the element its `commandfor`
 * names (nothing, if no element has that id), or, without `commandfor`, as
 * a `command` event bubbling up from the input itself (custom `--commands`
 * only: a built-in command needs a target). Returns whether it was sent.
 * @param {Element} source the input
 * @param {string | null | undefined} command
 * @returns {boolean}
 */
export function sendCommand(source, command) {
  if (source.hasAttribute("commandfor")) return invokeCommand(commandForElement(source), command, source);
  if (!command?.startsWith("--")) return false;
  const init = { command, source, bubbles: true, cancelable: true };
  const event = globalThis.CommandEvent
    ? new CommandEvent("command", init)
    : Object.assign(new Event("command", init), { command, source });
  source.dispatchEvent(event);
  return true;
}
