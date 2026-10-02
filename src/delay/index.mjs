/**
 * Wait, then resolve with `value`:
 *
 * - `delay()` waits for the next microtask.
 * - `delay(ms)` waits `ms` milliseconds (a promise-based `setTimeout`).
 * - `delay({ fps })` waits one frame period (`1000 / fps` ms), finishing on
 *   an animation frame. Use it to pace a loop. Like all
 *   `requestAnimationFrame` work, it waits while the page is hidden.
 *
 * Rejects with a `RangeError` if `fps` isn't a positive number.
 * @template T
 * @param {number | { fps: number }} [wait]
 * @param {T} [value]
 * @returns {Promise<T>}
 */
export default (wait, value) =>
  new Promise((resolve, reject) => {
    if (wait === undefined) return queueMicrotask(() => resolve(value));
    if (typeof wait === "object" && wait !== null) {
      const { fps } = wait;
      if (!(fps > 0)) return reject(new RangeError(`fps must be a positive number, got ${fps}`));
      // Pace by elapsed time, so any display refresh rate works. The 8ms
      // slack lets a frame that lands just short of the period count.
      const period = 1000 / fps;
      let start;
      const frame = (now) => {
        start ??= now;
        if (now - start >= period - 8) resolve(value);
        else requestAnimationFrame(frame);
      };
      return requestAnimationFrame(frame);
    }
    setTimeout(() => resolve(value), wait);
  });
