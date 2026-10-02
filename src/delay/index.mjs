/**
 * Wait, then resolve with `value`:
 *
 * - `delay()` waits for the next microtask.
 * - `delay(ms)` waits `ms` milliseconds (a promise-based `setTimeout`).
 * - `delay({ fps })` waits one frame period (`1000 / fps` ms), finishing on
 *   an animation frame. Use it to pace a loop. Like all
 *   `requestAnimationFrame` work, it waits while the page is hidden.
 *
 * Pass an `AbortSignal` as `signal` (in the options, or in the `{ fps }`
 * object) to cancel the wait: it then rejects with `signal.reason`, like
 * `fetch`. Rejects with a `RangeError` if `fps` isn't a positive number.
 * @template T
 * @param {number | { fps: number, signal?: AbortSignal }} [wait]
 * @param {T} [value]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<T>}
 */
export default (wait, value, { signal } = {}) =>
  new Promise((resolve, reject) => {
    const frames = typeof wait === "object" && wait !== null;
    signal ??= frames ? wait.signal : undefined;
    if (signal?.aborted) return reject(signal.reason);
    let cancel = () => {};
    const onAbort = () => {
      cancel();
      reject(signal.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    const done = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve(value);
    };
    if (wait === undefined) {
      let cancelled = false;
      cancel = () => (cancelled = true);
      return queueMicrotask(() => cancelled || done());
    }
    if (frames) {
      const { fps } = wait;
      if (!(fps > 0)) {
        signal?.removeEventListener("abort", onAbort);
        return reject(new RangeError(`fps must be a positive number, got ${fps}`));
      }
      // Pace by elapsed time, so any display refresh rate works. The 8ms
      // slack lets a frame that lands just short of the period count.
      const period = 1000 / fps;
      let start;
      let id;
      const frame = (now) => {
        start ??= now;
        if (now - start >= period - 8) done();
        else id = requestAnimationFrame(frame);
      };
      id = requestAnimationFrame(frame);
      cancel = () => cancelAnimationFrame(id);
      return;
    }
    const id = setTimeout(done, wait);
    cancel = () => clearTimeout(id);
  });
