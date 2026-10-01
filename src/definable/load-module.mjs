// Shared by <define-component> and <polyfill-window>: import the module an
// element's `src` names and hand back one of its exports, reporting the
// outcome the way <script src> does -- a `load` or `error` event on the
// element (neither bubbles). `src` resolves against the document's base
// URL, also like <script src>, so <base href> is respected.

/**
 * @param {HTMLElement} element  the element to fire load/error on
 * @param {(exported: unknown) => void} use  what to do with the export
 * @returns {Promise<unknown>} the export (rejects on failure, after `error` fires)
 */
export async function loadModule(element, use) {
  try {
    const src = element.getAttribute("src");
    if (!src) throw new TypeError(`<${element.localName}> needs a src attribute`);
    const url = new URL(src, document.baseURI).href;
    const module = await import(url);
    const name = element.getAttribute("import") ?? "default";
    if (!(name in module)) throw new TypeError(`${url} has no export named "${name}"`);
    const exported = module[name];
    use(exported);
    element.dispatchEvent(new Event("load"));
    return exported;
  } catch (error) {
    element.dispatchEvent(new ErrorEvent("error", { error, message: String(error?.message ?? error) }));
    throw error;
  }
}
