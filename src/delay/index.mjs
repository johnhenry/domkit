/**
 * Resolve with `value` after `wait` milliseconds, or on the next microtask
 * if `wait` is omitted.
 * @template T
 * @param {number} [wait]
 * @param {T} [val]
 * @returns {Promise<T>}
 */
export default (wait, val) =>
  new Promise((resolve, reject) => {
    try {
      if (wait === undefined) {
        return queueMicrotask(() => resolve(val));
      }
      return setTimeout(() => resolve(val), wait);
    } catch (error) {
      return reject(error);
    }
  });
