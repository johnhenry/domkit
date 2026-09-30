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
