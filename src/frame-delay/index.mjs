const STEP = 1 / 2;
const frameTest = (FPS) => {
  if (120 % FPS || FPS > 60) {
    throw new Error(`FPS must be a divisor of 120 and less than or equal to 60:
  1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60`);
  }
};
// Function that builds atop the browser's native *requestAnimationFrame* to
// Limits loops to a specified FPS when awaited.
export default (FPS = 60, val) => {
  frameTest(FPS);
  return new Promise((resolve) => {
    let count = -STEP;
    const loop = () => {
      count += STEP;
      if (count < 60 / 2 / FPS) {
        return window.requestAnimationFrame(loop);
      } else {
        resolve(val);
      }
    };
    loop();
  });
};
