/**
 * @typedef {Element[] & {
 *   stop(): void,
 *   addEventListener(type: "change", listener: (event: Event) => void, options?: boolean | AddEventListenerOptions): void,
 *   removeEventListener(type: "change", listener: (event: Event) => void, options?: boolean | EventListenerOptions): void,
 * }} LiveElementList
 */

/**
 * `querySelectorAll` that stays current: the returned array is refreshed in
 * place as elements are added to or removed from `root`, and fires `change`
 * when its contents change. Call `stop()` on it when done.
 *
 * By default only additions and removals are watched. With `attributes`,
 * attribute changes are too, so an element that starts or stops matching
 * because, say, a class was toggled is picked up: `true` for any attribute,
 * or a list of attribute names to limit the work.
 * @param {string} selector
 * @param {ParentNode} [root] the root to search and watch (default: document)
 * @param {{ attributes?: boolean | string[] }} [options]
 * @returns {LiveElementList}
 */
const liveQuerySelector = (selector, root = document, { attributes = false } = {}) => {
  const result = [...root.querySelectorAll(selector)];
  const events = new EventTarget();
  const observer = new MutationObserver(() => {
    const now = [...root.querySelectorAll(selector)];
    if (now.length === result.length && now.every((element, i) => element === result[i])) return;
    result.splice(0, result.length, ...now);
    events.dispatchEvent(new Event("change"));
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    ...(Array.isArray(attributes) ? { attributeFilter: attributes } : { attributes: Boolean(attributes) }),
  });
  // Non-enumerable, so the array still spreads, logs, and compares like one.
  Object.defineProperties(result, {
    stop: { value: () => observer.disconnect() },
    addEventListener: { value: events.addEventListener.bind(events) },
    removeEventListener: { value: events.removeEventListener.bind(events) },
  });
  return /** @type {LiveElementList} */ (result);
};

export default liveQuerySelector;
