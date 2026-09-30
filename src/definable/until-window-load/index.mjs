export default (...classNames) => {
  const run = () => {
    for (const className of classNames) {
      window.document.querySelectorAll(`.${className}`).forEach((loading) => {
        loading.classList.remove(className);
      });
    }
  };
  // If `load` already fired before this ran (a late dynamic import, a
  // slow-to-execute deferred module script), the listener below would
  // never fire and the class would stay stuck forever. Run immediately in
  // that case instead of only ever waiting for a future event.
  if (window.document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run);
  }
};
