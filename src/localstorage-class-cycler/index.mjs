import localStorageCycler from "../localstorage-cycler/index.mjs";
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
