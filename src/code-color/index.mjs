// <code-color>: syntax highlighting with the CSS Custom Highlight API.
// The text is never modified -- each token becomes a Range registered in a
// named highlight (`domkit-keyword`, `domkit-string`, …), styled with
// `::highlight(domkit-keyword) { color: … }`. So copy/paste, find-in-page,
// screen readers, and even editing behave exactly as on plain text.
// Where the API isn't supported, the code simply stays uncolored.
import { languageOf, tokenize } from "./tokenize.mjs";

export const TOKEN_TYPES = ["comment", "keyword", "string", "number", "function", "property", "tag", "attribute"];
const SUPPORTED = typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight === "function";

// One shared Highlight per token type, holding ranges from every instance.
const highlights = SUPPORTED
  ? Object.fromEntries(
      TOKEN_TYPES.map((type) => {
        const name = `domkit-${type}`;
        let highlight = CSS.highlights.get(name);
        if (!highlight) {
          highlight = new Highlight();
          CSS.highlights.set(name, highlight);
        }
        return [type, highlight];
      }),
    )
  : null;

/**
 * Highlights the code inside it (JavaScript, CSS, or HTML) with the CSS
 * Custom Highlight API, without changing the DOM. Re-highlights as the
 * text changes.
 *
 * @tag code-color
 * @summary Syntax highlighting that never touches your markup.
 *
 * @attr {string} language - `js`, `css`, or `html` (plus aliases like `javascript`, `ts`, `json`, `xml`). Default: a `language-*` class on a `<code>` inside, else `html`.
 */
export default class CodeColor extends HTMLElement {
  static observedAttributes = ["language"];

  #ranges = [];
  #observer = new MutationObserver(() => this.#schedule());
  #pending = false;
  #internals = this.attachInternals?.();

  connectedCallback() {
    this.#observer.observe(this, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    this.#highlight();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    this.#clear();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#highlight();
  }

  /**
   * The language in effect: `js`, `css`, `html`, or null if unrecognized.
   * @type {string | null}
   * @readonly
   */
  get resolvedLanguage() {
    const named =
      this.getAttribute("language") ??
      /(?:^|\s)lang(?:uage)?-(\S+)/.exec(this.querySelector("code[class*='lang']")?.className ?? "")?.[1] ??
      "html";
    return languageOf(named);
  }

  /** @type {string} */
  get language() {
    return this.getAttribute("language") ?? "";
  }
  set language(value) {
    this.setAttribute("language", value);
  }

  /**
   * Whether this browser supports the CSS Custom Highlight API (without it,
   * code is shown uncolored).
   * @type {boolean}
   * @readonly
   */
  static get supported() {
    return SUPPORTED;
  }

  /**
   * The current token ranges, by type (for tests and tooling).
   * @returns {{ type: string, text: string }[]}
   */
  tokens() {
    return this.#ranges.map(([type, range]) => ({ type, text: range.toString() }));
  }

  // Batch bursts of mutations (typing, streaming text) into one pass.
  #schedule() {
    if (this.#pending) return;
    this.#pending = true;
    queueMicrotask(() => {
      this.#pending = false;
      if (this.isConnected) this.#highlight();
    });
  }

  #clear() {
    if (highlights) for (const [type, range] of this.#ranges) highlights[type].delete(range);
    this.#ranges = [];
    try {
      this.#internals?.states.delete("highlighted");
    } catch {
      // CustomStateSet unsupported
    }
  }

  #highlight() {
    this.#clear();
    const language = this.resolvedLanguage;
    // Map character offsets of the full text onto its text nodes.
    const nodes = [];
    const starts = [];
    let text = "";
    const walker = document.createTreeWalker(this, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      nodes.push(node);
      starts.push(text.length);
      text += node.data;
    }
    if (!language || !nodes.length) return;
    const locate = (offset) => {
      let low = 0;
      let high = nodes.length - 1;
      while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (starts[mid] <= offset) low = mid;
        else high = mid - 1;
      }
      return [nodes[low], offset - starts[low]];
    };
    for (const [type, start, end] of tokenize(text, language)) {
      if (end <= start) continue;
      const range = new Range();
      range.setStart(...locate(start));
      const [endNode, endOffset] = locate(end - 1);
      range.setEnd(endNode, endOffset + 1);
      this.#ranges.push([type, range]);
      highlights?.[type].add(range);
    }
    if (SUPPORTED) {
      try {
        this.#internals?.states.add("highlighted");
      } catch {
        // CustomStateSet unsupported
      }
    }
  }
}
