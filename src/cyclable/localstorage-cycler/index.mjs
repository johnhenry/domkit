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

// Mirrors createNext -- steps backward instead of forward. A deliberately
// independent implementation (not derived from createNext) so it doesn't
// need to replicate createNext's own wraparound-index quirk (on wraparound,
// the `index` it returns is the raw out-of-bounds offset, not the real
// resolved position -- preserved here as createNext's existing behavior,
// not something to "fix" as a side effect of adding this).
const createPrevious =
  (key, handler, ...values) =>
  (...events) => {
    const stored = globalThis.localStorage.getItem(key);
    const index = values.indexOf(stored) - 1;
    const value = values[index] ?? values[values.length - 1];
    globalThis.localStorage.setItem(key, value);
    return {
      value,
      key,
      index,
      result: handler({ value, key, index, events }),
    };
  };

// Reads the current value without advancing state -- next()/previous()
// always mutate; this is the missing paired accessor.
const createPeek = (key, ...values) => () => {
  const stored = globalThis.localStorage.getItem(key);
  const index = values.indexOf(stored);
  const value = values[index] ?? values[0];
  return { value, key, index };
};

// Jumps directly to a specific value, instead of only ever being able to
// step relatively via next()/previous().
const createSet =
  (key, handler, ...values) =>
  (value, ...events) => {
    if (!values.includes(value)) {
      throw new Error(
        `"${value}" is not one of the configured values: ${values.join(", ")}`,
      );
    }
    const index = values.indexOf(value);
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
  const next = createNext(key, handler, ...values);
  // Attached to the returned function rather than changing its shape --
  // it stays directly callable exactly as before (`cycler()` still
  // advances), these are additive.
  next.previous = createPrevious(key, handler, ...values);
  next.peek = createPeek(key, ...values);
  next.set = createSet(key, handler, ...values);
  return next;
};
