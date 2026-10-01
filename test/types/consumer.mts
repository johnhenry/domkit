// Type-checked (never run) by `npm run check:types`: consumes the generated
// declarations through the package's own export paths, the way a user would.
import TabbedUI from "@johnhenry/domkit/tabbed-ui";
import "@johnhenry/domkit/tabbed-ui/global.mjs";

const tabs = document.querySelector("tabbed-ui");
if (tabs) {
  const index: number = tabs.selectedIndex;
  tabs.selectedIndex = index + 1;
  tabs.manual = true;
  const panels: Element[] = tabs.panels;
  // @ts-expect-error -- tabs is read-only
  tabs.tabs = [];
  tabs.addEventListener("change", (event) => event.target);
  void panels;
}
customElements.define("my-tabs", TabbedUI);
const fresh: TabbedUI = new TabbedUI();
void fresh;
