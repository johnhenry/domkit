// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Opens and closes the `<dialog>` or popover inside it with a keyboard
 * shortcut, keeping it fully native, or runs an invoker command on any
 * element. Polyfills `closedby="any"`/`"none"` on dialogs. */
export default class HotKey extends HTMLElement {
  /** The `<dialog>` or popover this element opens and closes: its first
   * `<dialog>` or `[popover]` descendant. */
  readonly target: HTMLElement | null;
  /** The `<dialog>` this element controls, if its target is one. */
  readonly dialog: HTMLDialogElement | null;
  command: string;
  /** The element `commandfor` names, like a button's `commandForElement`. */
  commandForElement: Element | null;
  hotkey: string;
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  nonModal: boolean;
  /** Whether the dialog or popover is open. */
  readonly open: boolean;
  /** Open the dialog (modally, unless `non-modal`) or popover. */
  show(): void;
  /** Close the dialog or popover. */
  close(returnValue?: string): void;
  /** Open the dialog or popover if it's closed, close it if it's open. */
  toggle(): void;
  /** Run `command` on the `commandfor` element, as a button would. Returns
   * false if there's no such element or command. */
  runCommand(): boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "hot-key": HotKey;
  }
}
