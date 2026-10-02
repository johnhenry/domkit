import localStorageCycler from "../localstorage-cycler/index.mjs";
import { applyValue } from "../apply-value.mjs";

/**
 * localStorageCycler with a built-in handler that puts the current value on
 * the target element(s): as one class among their others (the default), or
 * as the value of another attribute.
 * @param {Element | Element[]} targets
 * @param {string} key localStorage key
 * @param {string[]} values the values to cycle through ("" = none)
 * @param {{ attribute?: string }} [options] the attribute to set (default `class`)
 * @returns {import("../localstorage-cycler/index.mjs").Cycler}
 */
export default (targets, key, values, { attribute = "class" } = {}) => {
  const list = Array.isArray(targets) ? targets : [targets];
  const emit = ({ value }) => {
    for (const target of list) applyValue(target, attribute, values, value);
  };
  return localStorageCycler(key, emit, ...values);
};
