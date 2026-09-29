import textToDOMNodes from "@johnhenry/domable/text-to-dom";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const DEFAULT_SELECT_TAG = "select";

const isOption = (target) => {
  if (target.tagName === "OPTION") {
    return true;
  }
  const roles = (target.getAttribute("role") || "").toLowerCase().split(" ");
  if (roles.includes("option")) {
    return true;
  }
};

//https://stackoverflow.com/a/21725774/1290781
const events = [
  "blur",
  "change",
  "click",
  "dblclick",
  "error",
  "focus",
  "focusin",
  "focusout",
  "hover",
  "keydown",
  "keypress",
  "keyup",
  "load",
  "mousedown",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "resize",
  "scroll",
  "select",
  "submit",
];

export default class extends HTMLElement {
  #input;
  #select;

  #initial = [];
  #initialString = "";
  #keydownBound;
  #inputInputBound;
  #inputKeydownBound;
  #selectKeydownBound;
  #selectMouseoverBound;
  #selectClickBound;
  #selectChangeBound;
  constructor() {
    super();
  }
  set value(val) {
    const options = [...this.#select.options];
    let index;
    switch (typeof val) {
      case "string":
        index = options.findIndex((option) => {
          return option.value === val;
        });
        if (index < 0) {
          index = options.findIndex((option) => {
            return option.innerText === val;
          });
        }
        if (index < 0) {
          throw new Error(`Value "${val}" not found in select`);
        }
        break;
      case "number":
        if (val < 0 || val >= options.length) {
          throw new Error(`Index #${val} out of range`);
        }
        index = val;
        break;
    }

    this.#select.selectedIndex = index;
  }
  get selected() {
    const index = this.#select.selectedIndex;
    const element = this.#select.options[index];
    const value =
      element?.value ?? element?.dataset.value ?? element?.innerText ?? null;
    return { element, index, value };
  }

  get value() {
    return this.selected.value;
  }
  get index() {
    return this.selected.index;
  }

  initialClear() {
    const removed = [];

    while (this.children.length) {
      removed.push(this.children[0]);
      this.removeChild(this.children[0]);
    }

    return removed;
  }
  applySelect(kids) {
    return this.#select.append(...kids);
  }
  removeSelect() {
    while (this.#select.firstChild) {
      this.#select.removeChild(this.#select.firstChild);
    }
  }
  connectedCallback() {
    this.#input = globalThis.document.createElement("input");
    const selectTag = this.getAttribute("select-tag") || DEFAULT_SELECT_TAG;
    this.#select = globalThis.document.createElement(selectTag);
    this.#select.setAttribute("tabindex", "-1");
    this.#initial = this.initialClear();
    this.appendChild(this.#input);
    this.appendChild(this.#select);
    this.#initialString = [...this.#initial]
      .map((el) => el.outerHTML)
      .join("\n");
    this.applySelect(this.#initial);
    this.#select.setAttribute("size", this.getAttribute("size") || "");
    this.setSearchFunction(this.getAttribute("onsearch"));
    this.setSelectFunction(this.getAttribute("onselect"));
    this.setLoadingFunction(this.getAttribute("loading"));

    this.#keydownBound = this.keydown.bind(this);
    this.addEventListener("keydown", this.#keydownBound);

    this.#inputInputBound = this.inputInput.bind(this);
    this.#input.addEventListener("input", this.#inputInputBound);

    this.#inputKeydownBound = this.inputKeydown.bind(this);
    this.#input.addEventListener("keydown", this.#inputKeydownBound);

    this.#selectKeydownBound = this.selectKeydown.bind(this);
    this.#selectMouseoverBound = this.selectMouseover.bind(this);
    this.#selectClickBound = this.selectClick.bind(this);
    this.#selectChangeBound = this.selectChange.bind(this);

    this.#select.addEventListener("keydown", this.#selectKeydownBound);
    this.#select.addEventListener("mouseover", this.#selectMouseoverBound);
    this.#select.addEventListener("click", this.#selectClickBound);
    this.#select.addEventListener("change", this.#selectChangeBound);
  }
  inputKeydown(event) {
    const index = this.#select.selectedIndex;
    const length = this.#select.options.length;
    switch (event.key) {
      case "ArrowUp":
        if (index === -1) {
          this.#select.selectedIndex = length - 1;
        } else if (index === 0) {
          this.#select.selectedIndex = length - 1;
        } else {
          this.#select.selectedIndex -= 1;
        }
        this.#select.dispatchEvent(new Event("change"));
        break;
      case "ArrowDown":
        if (index === -1) {
          this.#select.selectedIndex = 0;
        } else if (index === length - 1) {
          this.#select.selectedIndex = 0;
        } else {
          this.#select.selectedIndex += 1;
        }
        this.#select.dispatchEvent(new Event("change"));
        break;
    }
  }
  keydown(event) {
    switch (event.key) {
      case "Enter":
        this.onselectFunction();
    }
  }

  selectChange(event) {
    event.stopPropagation();
    const { index, value } = this.selected;
    this.removeAttribute("selected");
    this.dispatchEvent(new Event("change"));
  }
  selectClick(event) {
    if (isOption(event.target)) {
      this.#select.dispatchEvent(new Event("change"));
      this.onselectFunction();
    }
  }
  selectMouseover(event) {
    if (isOption(event.target)) {
      const options = [...this.#select.options];
      // this.#select.selectedIndex = options.indexOf(event.target);
      this.#select.dispatchEvent(new Event("change"));
    }
  }
  selectKeydown(event) {
    switch (event.key) {
      case " ":
        this.onselectFunction();
    }
  }

  setSearchFunction(onsearchFunctionString) {
    if (!onsearchFunctionString) {
      return (this.onsearchFunction = () => {});
    }
    this.onsearchFunction = new AsyncFunction(
      "event",
      `return ${onsearchFunctionString}`
    );
  }
  setSelectFunction(onselectFunctionString) {
    let caller;
    if (!onselectFunctionString) {
      caller = () => {};
    } else {
      caller = new AsyncFunction("event", `return ${onselectFunctionString}`);
    }
    this.onselectFunction = async () => {
      this.setAttribute("selected", "");
      const target = this.selected.element;
      await caller({ target });
      this.dispatchEvent(new Event("select"));
      return;
    };
  }

  setLoadingFunction(loadingFunctionString) {
    if (!loadingFunctionString) {
      return (this.loadingFunction = null);
    }
    this.loadingFunction = new Function(
      "event",
      `return ${loadingFunctionString}`
    );
  }
  static get observedAttributes() {
    return ["size", "onsearch", "onselect"];
  }
  setSize(current) {
    this.#select?.setAttribute("size", current || "");
  }
  attributeChangedCallback(name, prev, current) {
    switch (name) {
      case "size":
        if (prev !== current) {
          this.setSize(current);
        }
        break;
      case "onsearch":
        if (current && prev !== current) {
          this.setSearchFunction(current);
        }
        break;
      case "onselect":
        if (current && prev !== current) {
          this.setSelectFunction(current);
        }
        break;
      case "loading":
        if (current && prev !== current) {
          this.setLoadingFunction(current);
        }
        break;
    }
  }
  get search() {
    return this.#input.value;
  }
  set search(value) {
    this.#input.value = value;
  }
  async inputInput() {
    this.removeSelect();
    const data = this.#input.value.trim();
    if (!data) {
      // Show initial HTML
      this.applySelect(this.#initial);
      return;
    }

    if (this.loadingFunction) {
      // Show loading screen
      const str = this.loadingFunction({
        data: data,
        initial: this.#initial,
        initialString: this.#initialString,
      });
      // throw error if not a string
      if (typeof loadStr !== "string") {
        throw new Error(
          "loading function must return a string (synchronously)"
        );
      }
      this.applySelect(textToDOMNodes(str));
    }
    this.setAttribute("loading", "");

    if (this.onsearchFunction) {
      // Show loaded HTML
      const str = await this.onsearchFunction({
        data: data,
        initial: this.#initial,
        initialString: this.#initialString,
      });
      this.applySelect(textToDOMNodes(str));
    }
    this.removeAttribute("loading");
  }
}
