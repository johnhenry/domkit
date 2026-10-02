// The stable custom elements: registration via global.mjs, plus each
// element's core contract -- including regressions for bugs that shipped
// unnoticed because nothing exercised them (see CHANGELOG 0.0.9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

const GLOBALS = {
  "frame-timer": "frame-timer",
  "drill-menu": "drill-menu",
  "tabbed-ui": "tabbed-ui",
  "matchable/query-container": "query-container",
  "matchable/attribute-provider": "attribute-provider",
  "cyclable/attribute-cycler": "attribute-cycler",
  "definable/define-component": "define-component",
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

test("frame-timer ticks at its fps, pauses/plays, and keeps one loop across a move", async () => {
  // Drive animation frames and their timestamps by hand: exact counts.
  let queued = [];
  let clock = 0;
  const real = [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame];
  let id = 0;
  globalThis.requestAnimationFrame = (callback) => (queued.push([++id, callback]), id);
  globalThis.cancelAnimationFrame = (cancel) => (queued = queued.filter(([i]) => i !== cancel));
  const frames = (n, ms = 1000 / 60) => {
    for (let i = 0; i < n; i++) {
      clock += ms;
      for (const [, callback] of queued.splice(0)) callback(clock);
    }
  };
  try {
    render(`<frame-timer fps="30"></frame-timer>`);
    const timer = document.querySelector("frame-timer");
    const events = [];
    for (const type of ["play", "pause"]) timer.addEventListener(type, () => events.push(type));
    const near = (actual, expected, why) =>
      assert.ok(Math.abs(actual - expected) <= 1, `${why}: expected ~${expected}, got ${actual}`);
    let before = timer.ticks;
    frames(60); // one second of 60Hz frames
    near(timer.ticks - before, 30, "30 ticks per second at fps=30, no content needed");

    document.body.append(timer); // disconnect + reconnect
    before = timer.ticks;
    frames(60);
    near(timer.ticks - before, 30, "still one loop after a move");

    timer.pause();
    before = timer.ticks;
    frames(60);
    assert.equal(timer.ticks, before, "no ticks while paused");
    assert.equal(timer.getAttribute("paused"), "");
    timer.removeAttribute("paused"); // the attribute controls it too
    frames(30);
    near(timer.ticks - before, 15, "resumes at the same rate");
    timer.fps = 60;
    before = timer.ticks;
    frames(60);
    near(timer.ticks - before, 60, "fps changes apply");
    assert.deepEqual(events, ["pause", "play"]);
  } finally {
    [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame] = real;
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

test("define-component defines a markup-only tag from an attribute", async () => {
  render(`<define-component name="x-hello" content="<b>hi</b>"></define-component><x-hello></x-hello>`);
  await tick();
  assert.equal(document.querySelector("x-hello").shadowRoot.innerHTML, "<b>hi</b>");
});

test("attribute-cycler applies its first value and cycles on a button click (full contract: test/browser)", () => {
  localStorage.clear();
  render(`<attribute-cycler storage-key="t" values="light,dark"><button>next</button></attribute-cycler>`);
  assert.ok(document.documentElement.classList.contains("light"));
  document.querySelector("button").click();
  assert.ok(document.documentElement.classList.contains("dark"));
  assert.equal(localStorage.getItem("t"), "dark");
  assert.equal(document.querySelector("attribute-cycler").getAttribute("value"), "dark");
});
