/**
 * @typedef {{ value: string, key: string, index: number, events: unknown[] }} CycleChange
 *   What a change handler receives.
 * @typedef {{ value: string, key: string, index: number, result: unknown }} CycleResult
 *   What stepping returns (`result` is the handler's return value).
 * @typedef {((...events: unknown[]) => CycleResult) & {
 *   previous(...events: unknown[]): CycleResult,
 *   peek(): { value: string, key: string, index: number },
 *   set(value: string, ...events: unknown[]): CycleResult,
 *   reset(...events: unknown[]): CycleResult,
 *   stop(): void,
 * }} Cycler
 *   Call it to step forward; it also carries previous/peek/set.
 */

const createNext =
  (key, handler, ...values) =>
  (...events) => {
    const stored = globalThis.localStorage.getItem(key) ?? values[0];
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
    const stored = globalThis.localStorage.getItem(key) ?? values[0];
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

// Forgets the stored value, going back to the default (the first value),
// as if nothing had ever been chosen.
const createReset =
  (key, handler, ...values) =>
  (...events) => {
    globalThis.localStorage.removeItem(key);
    const value = values[0];
    return { value, key, index: 0, result: handler({ value, key, index: 0, events }) };
  };

/**
 * Cycle a localStorage value through a fixed list. Pass an optional change
 * handler before the values: `localStorageCycler(key, handler, "a", "b")`.
 * Nothing is stored until a value is chosen. Changes made in other tabs
 * call the handler too (with the `storage` event as `events[0]`), until
 * `stop()` is called.
 * @param {string} key
 * @param {...(string | ((change: CycleChange) => unknown))} values
 * @returns {Cycler}
 */
export default (key, ...values) => {
  if (!key) {
    throw new Error("key is required");
  }
  const handler = typeof values[0] === "function" ? values.shift() : () => {};
  const stored = globalThis.localStorage.getItem(key) ?? values[0];
  const index = values.indexOf(stored);
  const value = values[index] ?? values[0];
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
  next.reset = createReset(key, handler, ...values);
  // Follow other tabs: another tab's choice (or reset, or clear()) is
  // applied here too.
  const onStorage = (event) => {
    if (event.storageArea !== globalThis.localStorage || (event.key !== key && event.key !== null)) return;
    const stored = event.key === null ? null : event.newValue;
    const value = values.includes(stored) ? stored : values[0];
    const index = values.indexOf(value);
    handler({ value, key, index, events: [event] });
  };
  globalThis.addEventListener?.("storage", onStorage);
  next.stop = () => globalThis.removeEventListener?.("storage", onStorage);
  return next;
};
