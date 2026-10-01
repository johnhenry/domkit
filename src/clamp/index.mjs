/**
 * `clamp(min, max)(value)`: restrict a number to the range [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {(value: number) => number}
 */
export default (min, max) => (target) => Math.min(Math.max(target, min), max);
