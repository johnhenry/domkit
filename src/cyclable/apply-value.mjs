// Shared by <attribute-cycler> and localstorage-attribute-cycler: put a
// cycle's current value on an element. For `class`, it's one class token
// among the element's others; for any other attribute, it's the
// attribute's whole value. An empty value means "none of them".

/**
 * @param {Element} element
 * @param {string} attribute
 * @param {string[]} values every value in the cycle
 * @param {string} value the current one
 */
export function applyValue(element, attribute, values, value) {
  if (attribute === "class") {
    element.classList.remove(...values.filter(Boolean));
    if (value) element.classList.add(value);
  } else if (value) {
    element.setAttribute(attribute, value);
  } else {
    clearValue(element, attribute, values);
  }
}

/**
 * Remove whatever the cycle put on `element`, and nothing else: its classes,
 * or the attribute if it holds one of the cycle's values.
 * @param {Element} element
 * @param {string} attribute
 * @param {string[]} values
 */
export function clearValue(element, attribute, values) {
  if (attribute === "class") element.classList.remove(...values.filter(Boolean));
  else if (values.includes(element.getAttribute(attribute) ?? "")) element.removeAttribute(attribute);
}
