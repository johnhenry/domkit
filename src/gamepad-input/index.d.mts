// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** The standard mapping's button names, by index. */
export declare const BUTTONS: array;

/** Turns a game controller's buttons (and left stick) into invoker
 * commands, sent to the `commandfor` element: one attribute per button,
 * named as in the standard gamepad mapping. */
export default class GamepadInput extends HTMLElement {
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  /** The element `commandfor` names. */
  readonly commandForElement: Element | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "gamepad-input": GamepadInput;
  }
}
