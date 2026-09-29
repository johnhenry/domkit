export default (...elements) => {
  const elms = [];
  for (const element of elements) {
    elms.push(element.outerHTML);
  }
  return elms.join("\n");
};
