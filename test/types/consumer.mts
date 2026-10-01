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

// stylable-select: the HTMLSelectElement-like contract.
import "@johnhenry/domkit/stylable-select/global.mjs";
const select = document.querySelector("stylable-select")!;
const chosen: string = select.value;
select.selectedIndex = -1;
const many: Element[] = select.selectedOptions;
const ok: boolean = select.checkValidity();
const owner: HTMLFormElement | null = select.form;
select.setCustomValidity("");
void chosen, many, ok, owner;
