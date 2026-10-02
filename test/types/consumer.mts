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

// infinite-combo-box: value contract + a typed search function.
import "@johnhenry/domkit/infinite-combo-box/global.mjs";
const combo = document.querySelector("infinite-combo-box")!;
combo.searchFunction = async (query: string, { signal }: { signal: AbortSignal }) => {
  void signal;
  return [query];
};
const comboValue: string = combo.value;
const chosenOption: Element | null = combo.selectedOption;
combo.open = true;
void comboValue, chosenOption;

// hotkey-dialog and attribute-cycler.
import "@johnhenry/domkit/hotkey-dialog/global.mjs";
import "@johnhenry/domkit/cyclable/attribute-cycler/global.mjs";
const hk = document.querySelector("hotkey-dialog")!;
const dlg: HTMLDialogElement | null = hk.dialog;
hk.toggle();
hk.close("done");
const cycler = document.querySelector("attribute-cycler")!;
cycler.next();
const theme: string = cycler.value;
const values: string[] = cycler.values;
cycler.attribute = "data-theme";
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

// Plain-function modules (declarations emitted by tsc from JSDoc).
import clamp from "@johnhenry/domkit/clamp";
import delay from "@johnhenry/domkit/delay";
import liveQuerySelector from "@johnhenry/domkit/live-query-selector";
import localStorageCycler from "@johnhenry/domkit/cyclable/localstorage-cycler";
import localStorageAttributeCycler from "@johnhenry/domkit/cyclable/localstorage-attribute-cycler";
import Hydratable from "@johnhenry/domkit/hydratable";
import { tokenize } from "@johnhenry/domkit/code-color/tokenize.mjs";

const pct: number = clamp(0, 100)(150);
const waited: string = await delay(10, "done");
const framed: number = await delay({ fps: 30 }, 1);
const live = liveQuerySelector("li");
live.addEventListener("change", () => live.length);
const first: Element | undefined = live[0];
live.stop();
const cycle = localStorageCycler("k", ({ value }) => value.toUpperCase(), "a", "b");
const stepped: string = cycle().value;
localStorageAttributeCycler(document.body, "theme", ["light", "dark"], { attribute: "data-theme" });
const peeked: number = cycle.peek().index;
const mixin = Hydratable(async function () {});
const spans: [string, number, number][] = tokenize("let x", "js");
// @ts-expect-error -- clamp needs numbers
clamp("a", 1);
// @ts-expect-error -- fps, not frames
delay({ frames: 2 });
void pct, waited, framed, first, stepped, peeked, mixin, spans;

// matchable container mode.
import { compileQuery, ContainerQueryList } from "@johnhenry/domkit/matchable/container-query.mjs";
const fits: boolean = compileQuery("(min-width: 400px)")({ width: 500, height: 100, em: 16, rem: 16 });
const cql = new ContainerQueryList("(min-width: 400px)", document.body);
const cqlMatches: boolean = cql.matches;
void fits, cqlMatches;

// infinite-combo-box paging.
const paged = document.querySelector("infinite-combo-box")!;
paged.searchFunction = async (query: string, { cursor }: { signal: AbortSignal; cursor: string }) => ({
  options: [query],
  next: cursor ? null : "2",
});
const more: boolean = paged.hasMore;
await paged.loadMore();
void more;

// infinite-combo-box strings.
import { DEFAULT_STRINGS } from "@johnhenry/domkit/infinite-combo-box";
const defaults: Readonly<Record<string, unknown>> = DEFAULT_STRINGS;
paged.strings = { loadMore: "Mehr laden" };
void defaults;
