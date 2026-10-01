import localStorageCycler from "../localstorage-cycler/index.mjs";
/**
 * localStorageCycler with a built-in handler that puts the current value
 * on the target element(s) as a class.
 * @param {Element | Element[]} targets
 * @param {string} key localStorage key
 * @param {...string} classes the values to cycle through ("" = no class)
 * @returns {import("../localstorage-cycler/index.mjs").Cycler}
 */
export default (targets, key, ...classes) => {
  const values = classes;
  const emit = ({ value }) => {
    const target_list = Array.isArray(targets) ? targets : [targets];
    for (const target of target_list) {
      target.classList.remove(...values.filter((s) => s));
      if (value) {
        target.classList.add(value);
      }
    }
  };
  return localStorageCycler(key, emit, ...values);
};
