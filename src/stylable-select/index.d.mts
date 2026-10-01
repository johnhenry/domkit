// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** A listbox whose options are ordinary, fully stylable elements, with the
 * same API, form behavior, and events as a native `<select>` listbox. */
export default class StylableSelect extends HTMLElement {
  /** Every option, in document order (including those in groups). */
  readonly options: Element[];
  /** The selected options. */
  readonly selectedOptions: Element[];
  /** Index of the first selected option, or -1. Setting it selects only that
   * option. Script changes don't fire events. */
  selectedIndex: number;
  /** Value of the first selected option, or "". Setting it selects the first
   * option with that value (or nothing, if none matches). */
  value: string;
  /** Number of options. */
  readonly length: number;
  /** "select-one" or "select-multiple", like a native select. */
  readonly type: string;
  name: string;
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  size: number;
  /** The option at `index`. */
  item(index: number): Element | null;
  /** The form this element belongs to. */
  readonly form: HTMLFormElement | null;
  /** Labels associated with this element. */
  readonly labels: NodeList;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "stylable-select": StylableSelect;
  }
}
