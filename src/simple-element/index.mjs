const { HTMLElement } = globalThis;
import textToDOMNodes from "../text-to-DOM-nodes/index.mjs";
const createElement =
  (
    { shadowMode = "open", useShadow = true, baseElement = HTMLElement } = {
      shadowMode: "open",
      useShadow: true,
      baseElement: HTMLElement,
    }
  ) =>
  (strs, ...substs) => {
    const str =
      typeof strs === "string"
        ? strs
        : substs.reduce((prev, cur, i) => prev + cur + strs[i + 1], strs[0]);

    if (useShadow) {
      return class extends baseElement {
        constructor() {
          super();
          const children = textToDOMNodes(str);
          this.attachShadow({ mode: shadowMode }).append(...children);
        }
      };
    } else {
      return class extends baseElement {
        constructor() {
          super();
          const children = textToDOMNodes(str);
          this.append(...children);
        }
      };
    }
  };

const register =
  (tagname, options, ...rest) =>
  (strs, ...substs) =>
    globalThis.customElements.define(
      tagname,
      createElement(options)(strs, ...substs),
      ...rest
    );
const shadowOpen = createElement();
const shadowClosed = createElement({ shadowMode: "closed" });

const constructSuperclass = (
  {
    HTML = "",
    shadowHTML = "",
    shadowMode = "open",
    baseElement = HTMLElement,
  } = {
    HTLM: "",
    shadowHTML: "",
    shadowMode: "open",
    baseElement: HTMLElement,
  }
) => {
  return class extends baseElement {
    constructor() {
      super();
      if (shadowHTML) {
        const children = textToDOMNodes(shadowHTML);
        this.attachShadow({ mode: shadowMode }).append(...children);
      }
      if (HTML) {
        const children = textToDOMNodes(HTML);
        this.append(...children);
      }
    }
  };
};
export { register, shadowOpen, shadowClosed, constructSuperclass };
