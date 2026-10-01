// The stable custom elements: registration via global.mjs, plus each
// element's core contract -- including regressions for bugs that shipped
// unnoticed because nothing exercised them (see CHANGELOG 0.0.9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

const GLOBALS = {
  "code-color": "code-color",
  "event-consumer": "event-consumer",
  "infinite-combo": "infinite-combo",
  "internal-timer": "internal-timer",
  "menu-component": "menu-component",
  "stylable-select": "stylable-select",
  "tabbed-ui": "tabbed-ui",
  "matchable/query-container": "query-container",
  "matchable/attribute-provider": "attribute-provider",
  "cyclable/class-cycler": "class-cycler",
  "definable/define-component": "define-component",
  "definable/define-component-by-content": "define-component-by-content",
  "definable/polyfill-window": "polyfill-window",
};
for (const path of Object.keys(GLOBALS)) {
  await import(`../src/${path}/global.mjs`);
}

test("every stable element's global.mjs registers its documented tag", () => {
  for (const [path, tag] of Object.entries(GLOBALS)) {
    assert.ok(customElements.get(tag), `${path}/global.mjs should define <${tag}>`);
  }
});

test("code-color highlights its initial content (not only later changes)", async () => {
  render(`<code-color mode="js"><pre>const x = 1; // one
let y = obj.prop;</pre></code-color>`);
  await tick();
  const html = document.querySelector("code-color").innerHTML;
  assert.match(html, /<span style="color:\s*mediumblue;?">const<\/span>/);
  assert.match(
    html,
    /<span style="color:\s*green;?">\/\/ one\n<\/span><span style="color:\s*mediumblue;?">let<\/span>/,
    "a // comment ends at the newline",
  );
});

test("stylable-select treats plain <option> and role=option as options", async () => {
  render(`<stylable-select>
    <optgroup label="g"><option value="a">A</option><option>B</option></optgroup>
    <div role="option" data-value="c">C</div>
  </stylable-select>`);
  const select = document.querySelector("stylable-select");
  assert.equal(select.options.length, 3);
  const values = [];
  select.addEventListener("change", (e) => values.push(e.detail));
  select.selectedIndex = 1;
  select.selectedIndex = 2;
  select.selectedIndex = 99; // clamps
  assert.deepEqual(values, ["B", "c", "c"]);
  assert.ok(select.options[2].hasAttribute("data-checked"));
  assert.equal(select.value, "c");
});

test("infinite-combo replaces options with onsearch's HTML, via a loading placeholder", async () => {
  globalThis.search = async ({ data }) => {
    await tick(20);
    return `<option value="r">result for ${data}</option>`;
  };
  render(`<infinite-combo onsearch="search(event)" loading="'<option>loading</option>'">
    <option value="i">initial</option>
  </infinite-combo>`);
  const combo = document.querySelector("infinite-combo");
  const input = combo.querySelector("input");
  const list = combo.querySelector("select");
  input.value = "abc";
  input.dispatchEvent(new Event("input"));
  await tick();
  assert.equal(list.textContent.trim(), "loading");
  assert.ok(combo.hasAttribute("loading"));
  await tick(40);
  assert.equal(list.options.length, 1);
  assert.equal(list.options[0].textContent, "result for abc");
  assert.ok(!combo.hasAttribute("loading"));
  input.value = "";
  input.dispatchEvent(new Event("input"));
  await tick();
  assert.equal(list.options[0].value, "i", "empty input restores the initial options");
});

test("tabbed-ui shows the clicked tab's panel (full contract: test/browser/tabbed-ui.spec.mjs)", () => {
  render(`<tabbed-ui selected-index="1">
    <div><button>1</button><button>2</button></div>
    <div id="p1"></div><div id="p2"></div>
  </tabbed-ui>`);
  const [b1] = document.querySelectorAll("button");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  assert.equal(p1.hidden, true);
  assert.equal(p2.hidden, false);
  b1.click();
  assert.equal(p1.hidden, false);
  assert.equal(p2.hidden, true);
  assert.equal(b1.getAttribute("aria-selected"), "true");
  assert.equal(document.querySelector("tabbed-ui").getAttribute("selected-index"), "0");
});

test("event-consumer runs onevent and stops propagation unless `bubbles`", () => {
  render(`<div id="outer">
    <event-consumer id="a" events="click" onevent="this.dataset.hit = event.type"><button id="b1"></button></event-consumer>
    <event-consumer id="c" events="click" onevent="" bubbles><button id="b2"></button></event-consumer>
  </div>`);
  let reachedOuter = 0;
  document.getElementById("outer").addEventListener("click", () => reachedOuter++);
  document.getElementById("b1").click();
  assert.equal(document.getElementById("a").dataset.hit, "click");
  assert.equal(reachedOuter, 0, "stopped by default");
  document.getElementById("b2").click();
  assert.equal(reachedOuter, 1, "bubbles attribute lets it through");
});

test("internal-timer ticks once per period, pauses, and keeps one loop across a move", async () => {
  // Drive animation frames by hand so tick counts are exact, not timing.
  const queued = [];
  const realRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback) => queued.push(callback);
  const frames = async (n) => {
    for (let i = 0; i < n; i++) {
      for (const callback of queued.splice(0)) callback(performance.now());
      await tick();
    }
  };
  try {
    render(`<internal-timer fps="60">x</internal-timer>`);
    const timer = document.querySelector("internal-timer");
    let ticks = 0;
    timer.addEventListener("tick", () => ticks++);
    await tick();
    await frames(10);
    assert.ok(ticks >= 9 && ticks <= 10, `~1 tick per frame at 60fps (got ${ticks})`);

    document.body.append(timer); // disconnect + reconnect in one task
    await tick();
    ticks = 0;
    await frames(10);
    assert.ok(ticks <= 10, `one loop after a move, not two (got ${ticks} ticks in 10 frames)`);
    assert.equal(timer.shadowRoot.querySelectorAll("slot").length, 1);

    let paused = 0;
    timer.addEventListener("paused", () => paused++);
    timer.dispatchEvent(new CustomEvent("pause"));
    await frames(2);
    ticks = 0;
    await frames(10);
    assert.equal(ticks, 0);
    assert.equal(paused, 1);
  } finally {
    window.requestAnimationFrame = realRAF;
  }
});

test("query-container swaps its wrapper element by media query, even after a move", async () => {
  // (happy-dom only fires MediaQueryList "change" when a query starts
  // matching, so this goes wide -> narrow with a max-width query.)
  const qc = document.createElement("query-container");
  qc.innerHTML = "<li>a</li>";
  qc.setAttribute("default", "ul");
  qc.setAttribute("query", "[(max-width: 599px)] ol.narrow");
  render("");
  document.body.append(qc);
  await tick();
  assert.equal(qc.firstElementChild.localName, "ul");
  assert.equal(qc.querySelector("li").parentElement, qc.firstElementChild, "children are wrapped");
  document.body.prepend(qc); // disconnect + reconnect
  window.happyDOM.setViewport({ width: 500 });
  await tick();
  assert.equal(qc.firstElementChild.localName, "ol");
  assert.ok(qc.firstElementChild.classList.contains("narrow"));
  assert.equal(qc.querySelector("li").textContent, "a", "children move with it");
  window.happyDOM.setViewport({ width: 1024 });
  await tick();
});

test("define-component-by-content defines a tag from an attribute", async () => {
  render(`<define-component-by-content name="x-hello" content="<b>hi</b>"></define-component-by-content><x-hello></x-hello>`);
  await tick();
  assert.equal(document.querySelector("x-hello").shadowRoot.innerHTML, "<b>hi</b>");
});

test("class-cycler exposes a global cycler and removes it on disconnect", () => {
  localStorage.clear();
  render(`<class-cycler global="cycleTheme" storage-key="t" classes="light,dark"></class-cycler>`);
  assert.ok(document.body.classList.contains("light"));
  globalThis.cycleTheme();
  assert.ok(document.body.classList.contains("dark"));
  document.querySelector("class-cycler").remove();
  assert.equal(globalThis.cycleTheme, undefined);
});
