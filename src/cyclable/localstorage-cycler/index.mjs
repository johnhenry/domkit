const createNext =
  (key, handler, ...values) =>
  (...events) => {
    const stored = globalThis.localStorage.getItem(key);
    const index = values.indexOf(stored) + 1;
    const value = values[index] ?? values[0];
    globalThis.localStorage.setItem(key, value);
    return {
      value,
      key,
      index,
      result: handler({ value, key, index, events }),
    };
  };
export default (key, ...values) => {
  if (!key) {
    throw new Error("key is required");
  }
  const handler = typeof values[0] === "function" ? values.shift() : () => {};
  const stored = globalThis.localStorage.getItem(key) ?? values[0];
  const index = values.indexOf(stored);
  const value = values[index] ?? values[0];
  globalThis.localStorage.setItem(key, value);
  handler({
    value,
    key,
    index,
    events: [new CustomEvent("init", { detail: { value, key, index } })],
  });
  return createNext(key, handler, ...values);
};
