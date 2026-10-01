// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** A text input with a popup list of options: filtered from its own
 * `<option>` children, fetched from a URL, or produced by a function.
 * Form-associated, with the WAI-ARIA combobox keyboard pattern. */
export default class InfiniteComboBox extends HTMLElement {
  /** The current value: the chosen option's value, or the typed text with
   * `allow-custom`. Setting it chooses the matching option (by value, then
   * by label). Script changes don't fire events. */
  value: string;
  /** The text in the input. */
  text: string;
  /** The options currently in the list. */
  readonly options: Element[];
  /** Whether the source has more results for the current query. */
  readonly hasMore: boolean;
  /** Load the next page of results for the current query (what scrolling to
   * the end of the list does). Resolves when it's appended. */
  loadMore(): Promise<void>;
  /** The chosen option element, if it's in the list. */
  readonly selectedOption: Element | null;
  /** The inner `<input>` (generated, or the one you wrote as a child). */
  readonly input: HTMLInputElement | null;
  /** A function that produces options for a query, instead of filtering the
   * child `<option>`s or fetching `src`: `async (query, { signal }) =>`
   * an HTML string, an array of strings / `{ value, label }` / Nodes, or a
   * Node. `signal` aborts when a newer search starts.
   * To page results, return `{ options, next, total? }`: `next` is the
   * cursor passed back as `cursor` for the following page (null when
   * there are no more). */
  searchFunction: ((query: string, init: { signal: AbortSignal, cursor: string }) => unknown) | null;
  open: boolean;
  name: string;
  src: string;
  allowCustom: boolean;
  disabled: boolean;
  required: boolean;
  readonly form: HTMLFormElement | null;
  readonly labels: NodeList;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
  /** Focus the input. */
  focus(options?: FocusOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "infinite-combo-box": InfiniteComboBox;
  }
}
