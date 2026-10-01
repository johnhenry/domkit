// await frameDelay(fps, value): resolve with `value` after one frame period
// (1000 / fps milliseconds), on an animation frame. Paced by elapsed time,
// so any fps works on any display refresh rate; like all
// requestAnimationFrame work, it waits while the page is hidden.

/**
 * @template T
 * @param {number} [fps=60] frames per second; must be > 0
 * @param {T} [value]
 * @returns {Promise<T>}
 */
export default (fps = 60, value) => {
  if (!(fps > 0)) throw new RangeError(`fps must be a positive number, got ${fps}`);
  const period = 1000 / fps;
  return new Promise((resolve) => {
    let start;
    const frame = (now) => {
      start ??= now;
      // Resolve on the frame closest to the target time (within half a
      // 60Hz frame), rather than always overshooting by up to a frame.
      if (now - start >= period - 8) resolve(value);
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
};
