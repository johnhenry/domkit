import createTabbedUI from "./create-tabbed-ui.mjs";
export default class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    createTabbedUI(this);
  }
}
