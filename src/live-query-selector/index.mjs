import createMutableNodeList from "../create-mutable-nodelist/index.mjs";

const liveQuerySelector = (
  selector,
  element = document.getRootNode(),
  useNodeList = false
) => {
  // Initialize results with current nodes.
  const init = element.querySelectorAll(selector);
  const result = useNodeList ? createMutableNodeList(...init) : [...init];
  // Create observer instance.
  const observer = new globalThis.MutationObserver(() => {
    while (result.length) {
      result.pop();
    }
    for (const node of element.querySelectorAll(selector)) {
      result.push(node);
    }
  });
  // Set up observer.
  observer.observe(element, { childList: true, subtree: true });
  // Non-enumerable so it doesn't show up in for...of/spread/JSON over the
  // returned array/MutableNodeList -- there was previously no way at all
  // to stop the observer short of the whole document being torn down.
  Object.defineProperty(result, "stop", {
    value: () => observer.disconnect(),
    enumerable: false,
  });
  return result;
};

export default liveQuerySelector;
