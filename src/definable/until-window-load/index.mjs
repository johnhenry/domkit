export default (...classNames) => {
  window.addEventListener("load", () => {
    for (const className of classNames) {
      window.document.querySelectorAll(`.${className}`).forEach((loading) => {
        loading.classList.remove(className);
      });
    }
  });
};
