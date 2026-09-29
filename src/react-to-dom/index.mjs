import createElement, { _ } from "../create-element/index.mjs";
const REACT_FRAGMENT_SYMBOL = Symbol.for("react.fragment");
const reactToDom = ({ $$typeof = REACT_FRAGMENT_SYMBOL, type, props = {} }) => {
  if ($$typeof === REACT_FRAGMENT_SYMBOL) {
    const { children } = props;
    return _(...children.map(reactToDom));
  }
  const children =
    "children" in props
      ? Array.isArray(props.children)
        ? props.children
        : [props.children]
      : [];
  return createElement(type, { ...props, children });
};
export default reactToDom;
