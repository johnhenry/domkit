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

// combo-box: value contract + a typed search function.
import "@johnhenry/domkit/combo-box/global.mjs";
const combo = document.querySelector("combo-box")!;
combo.searchFunction = async (query: string, { signal }: { signal: AbortSignal }) => {
  void signal;
  return [query];
};
const comboValue: string = combo.value;
const chosenOption: Element | null = combo.selectedOption;
combo.open = true;
void comboValue, chosenOption;

// hotkey-dialog and class-cycler.
import "@johnhenry/domkit/hotkey-dialog/global.mjs";
import "@johnhenry/domkit/cyclable/class-cycler/global.mjs";
const hk = document.querySelector("hotkey-dialog")!;
const dlg: HTMLDialogElement | null = hk.dialog;
hk.toggle();
hk.close("done");
const cycler = document.querySelector("class-cycler")!;
cycler.next();
const theme: string = cycler.value;
const values: string[] = cycler.values;
void dlg, theme, values;

// drill-menu.
import "@johnhenry/domkit/drill-menu/global.mjs";
const drill = document.querySelector("drill-menu")!;
const opened: boolean = drill.push("profile");
drill.pop();
drill.screen = null;
void opened;

// matchable.
import "@johnhenry/domkit/matchable/query-container/global.mjs";
import "@johnhenry/domkit/matchable/attribute-provider/global.mjs";
const qc: HTMLElement | null = document.querySelector("query-container");
const ap: HTMLElement | null = document.querySelector("attribute-provider");
void qc, ap;

// definable.
import "@johnhenry/domkit/definable/define-component/global.mjs";
import "@johnhenry/domkit/definable/polyfill-window/global.mjs";
const definer = document.querySelector("define-component")!;
const cls: CustomElementConstructor = await definer.ready;
const polyfill = document.querySelector("polyfill-window")!;
const loaded: unknown = await polyfill.ready;
void cls, loaded;

// frame-timer.
import "@johnhenry/domkit/frame-timer/global.mjs";
const timer = document.querySelector("frame-timer")!;
timer.play();
const count: number = timer.ticks;
const isPaused: boolean = timer.paused;
void count, isPaused;

// code-color.
import "@johnhenry/domkit/code-color/global.mjs";
const highlighter = document.querySelector("code-color")!;
highlighter.language = "css";
const resolved: string | null = highlighter.resolvedLanguage;
const found: { type: string; text: string }[] = highlighter.tokens();
void resolved, found;
