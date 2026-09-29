const $$typeof = Symbol.for("react.element");
const REACT_FRAGMENT_SYMBOL = Symbol.for("react.fragment");
const domToReact = (dom) => {
  if (dom instanceof DocumentFragment) {
    const children = [];
    for (const child of dom.childNodes) {
      children.push(domToReact(child));
    }
    return {
      $$typeof,
      type: REACT_FRAGMENT_SYMBOL,
      key: null,
      ref: null,
      props: {
        children,
      },
      _owner: null,
      _store: {},
    };
  } else if (dom.nodeType === Node.ELEMENT_NODE) {
    const element = dom.tagName.toLowerCase();
    const props = {};
    const children = [];
    for (const attr of dom.attributes) {
      switch (attr.name) {
        case "class":
          props.className = attr.value;
          break;
        default:
          props[attr.name] = attr.value;
      }
    }
    for (const child of dom.childNodes) {
      children.push(domToReact(child));
    }
    return {
      $$typeof,
      type: element,
      key: null,
      ref: null,
      props: {
        ...props,
        children,
      },
      _owner: null,
      _store: {},
    };
  } else if (dom.nodeType === Node.TEXT_NODE) {
    return dom.nodeValue;
  }
};
export default domToReact;
