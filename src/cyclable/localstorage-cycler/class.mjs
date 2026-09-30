import localStorageCycler from "./index.mjs";
export default (target, key, ...classes) => {
  const values = classes;
  const emit = ({ value }) => {
    target.classList.remove(...values.filter((s) => s));
    if (value) {
      target.classList.add(value);
    }
  };
  return localStorageCycler(key, emit, ...values);
};
