// The elements whose loading this waits for, besides the window's own
// `load`: anything that registers or installs code from HTML, so that
// hidden content isn't shown before the components in it exist.
const LOADERS = "define-component, polyfill-window";

/**
 * Remove these classes from every element that has them once the page is
 * ready: the window has loaded (immediately, if it already has), and every
 * `<define-component>` and `<polyfill-window>` on the page has finished,
 * whether it succeeded or failed.
 * @param {...string} classNames
 * @returns {Promise<void>} resolves once the classes are removed
 */
export default async (...classNames) => {
  // If `load` already fired before this ran (a late dynamic import, a
  // slow-to-execute deferred module script), waiting for the event would
  // leave the class stuck forever, so only wait if it hasn't.
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  }
  // A loader that isn't upgraded (its script never loaded) has no `ready`,
  // and is skipped rather than waited on forever.
  const pending = [...document.querySelectorAll(LOADERS)].map((element) => element.ready).filter(Boolean);
  await Promise.allSettled(pending);
  for (const className of classNames) {
    for (const element of document.querySelectorAll(`.${CSS.escape(className)}`)) {
      element.classList.remove(className);
    }
  }
};
