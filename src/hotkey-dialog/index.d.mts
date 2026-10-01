// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** Opens and closes the `<dialog>` inside it with a keyboard shortcut,
 * keeping the dialog fully native. Polyfills `closedby="any"`/`"none"`. */
export default class HotkeyDialog extends HTMLElement {
  /** The `<dialog>` this element controls: its first `<dialog>` descendant. */
  readonly dialog: HTMLDialogElement | null;
  hotkey: string;
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  nonModal: boolean;
  /** Open the dialog (modally, unless `non-modal`). */
  show(): void;
  /** Close the dialog. */
  close(returnValue?: string): void;
  /** Open the dialog if it's closed, close it if it's open. */
  toggle(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "hotkey-dialog": HotkeyDialog;
  }
}
