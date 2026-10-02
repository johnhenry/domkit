// cyclable, hydratable (+ mounts), and matchable's shared grammar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

const localStorageCycler = (
  await import("../src/cyclable/localstorage-cycler/index.mjs")
).default;
const localStorageAttributeCycler = (
  await import("../src/cyclable/localstorage-attribute-cycler/index.mjs")
).default;
const Hydratable = (await import("../src/hydratable/index.mjs")).default;
const { parseQuerySections } = await import(
  "../src/matchable/query-sections.mjs"
);

test("localstorage-cycler steps forward/back, peeks, sets, and wraps", () => {
  localStorage.clear();
  const seen = [];
  const cycle = localStorageCycler("k", ({ value }) => seen.push(value), "a", "b", "c");
  assert.equal(cycle.peek().value, "a", "starts at the first value");
  assert.equal(cycle().value, "b");
  assert.equal(cycle().value, "c");
  assert.equal(cycle().value, "a", "wraps forward");
  assert.equal(cycle.previous().value, "c", "wraps backward");
  assert.deepEqual(cycle.peek(), { value: "c", key: "k", index: 2 });
  assert.equal(cycle.set("b").value, "b");
  assert.throws(() => cycle.set("z"));
  assert.deepEqual(seen, ["a", "b", "c", "a", "c", "b"], "handler sees init + every change");
});

test("localstorage-cycler resumes from a persisted value", () => {
  localStorage.setItem("persisted", "b");
  const cycle = localStorageCycler("persisted", "a", "b", "c");
  assert.equal(cycle.peek().value, "b");
  assert.equal(cycle().value, "c");
});

test("localstorage-cycler stores nothing until a value is chosen; reset forgets it", () => {
  localStorage.clear();
  const seen = [];
  const cycle = localStorageCycler("fresh", ({ value }) => seen.push(value), "a", "b", "c");
  assert.equal(localStorage.getItem("fresh"), null, "init doesn't store");
  assert.equal(cycle().value, "b", "stepping from the unset default moves on");
  assert.equal(localStorage.getItem("fresh"), "b");
  assert.equal(cycle.reset().value, "a");
  assert.equal(localStorage.getItem("fresh"), null);
  assert.deepEqual(seen, ["a", "b", "a"]);
  cycle.stop();
});

test("localstorage-cycler follows storage events from other tabs until stopped", () => {
  localStorage.clear();
  const seen = [];
  const cycle = localStorageCycler("synced", ({ value }) => seen.push(value), "a", "b");
  const fire = (newValue) =>
    window.dispatchEvent(new StorageEvent("storage", { key: "synced", newValue, storageArea: localStorage }));
  fire("b");
  fire(null);
  cycle.stop();
  fire("b");
  assert.deepEqual(seen, ["a", "b", "a"]);
});

test("localstorage-attribute-cycler swaps exactly one of its classes", () => {
  localStorage.clear();
  const el = render(`<div class="keep"></div>`).firstElementChild;
  const cycle = localStorageAttributeCycler(el, "theme", ["light", "dark"]);
  assert.deepEqual([...el.classList], ["keep", "light"]);
  cycle();
  assert.deepEqual([...el.classList], ["keep", "dark"]);
});

test("localstorage-attribute-cycler can set another attribute; empty removes it", () => {
  localStorage.clear();
  const el = render(`<div></div>`).firstElementChild;
  const cycle = localStorageAttributeCycler(el, "mode", ["", "dark"], { attribute: "data-theme" });
  assert.equal(el.hasAttribute("data-theme"), false);
  cycle();
  assert.equal(el.getAttribute("data-theme"), "dark");
  cycle();
  assert.equal(el.hasAttribute("data-theme"), false);
});

test("hydratable hydrates once, dehydrates, and can hydrate again", async () => {
  let hydrations = 0;
  let teardowns = 0;
  class Widget {}
  Object.assign(
    Widget.prototype,
    Hydratable(async function ({ finalizer, dehydrator }) {
      hydrations++;
      this.data = "loaded";
      finalizer(() => (this.finalized = true));
      dehydrator(() => {
        teardowns++;
        this.data = null;
      });
    }),
  );
  const w = new Widget();
  await w.hydrate();
  await w.hydrate();
  assert.equal(hydrations, 1, "second hydrate() is a no-op");
  assert.equal(w.finalized, true);
  await w.dehydrate();
  assert.equal(teardowns, 1);
  assert.equal(w.data, null);
  await w.hydrate();
  assert.equal(hydrations, 2, "hydrates again after dehydrate()");
});

test("mounts reuse a real first/last element past whitespace, and only unmount what they created", async () => {
  render(`\n  <main id="app"></main>\n  <script></script>\n`);
  const { resolveFirst } = await import("../src/hydratable/mounts/first.mjs");
  const { resolveLast } = await import("../src/hydratable/mounts/last.mjs");
  const unmount = (await import("../src/hydratable/mounts/unmount.mjs")).default;

  const first = resolveFirst();
  assert.equal(first.id, "app", "skips leading whitespace to reuse <main>");
  assert.equal(unmount(first), false, "never removes an element it didn't create");

  const last = resolveLast();
  assert.equal(last.localName, "div", "a trailing <script> is unsuitable, so a div is created");
  assert.equal(document.body.lastElementChild, last);
  assert.equal(unmount(last), true);
  assert.equal(last.isConnected, false);
});

test("matchable's grammar: pipe-separated, bracket-less sections always apply", () => {
  const sections = parseQuerySections(
    " base | [(min-width: 600px)] wide | [(max-width: 599px)] narrow ",
  );
  assert.deepEqual(
    sections.map((s) => s.value),
    ["base", "wide", "narrow"],
  );
  assert.equal(sections[0].mql.matches, true, "no query = always matches");
  assert.equal(sections[1].mql.matches, true, "1024px viewport is wide");
  assert.equal(sections[2].mql.matches, false);
  assert.deepEqual(parseQuerySections(""), []);
  const [tricky] = parseQuerySections("[(min-width: 600px)] ol[data-x=1].wide");
  assert.equal(tricky.mql.media.replace(/\s/g, ""), "(min-width:600px)");
  assert.equal(tricky.value, "ol[data-x=1].wide", "a ] inside the value isn't the query's end");
});

test("attribute-provider applies, survives a move, and follows the viewport", async () => {
  await import("../src/matchable/attribute-provider/global.mjs");
  render(`
    <attribute-provider
      classes="base | [(min-width: 600px)] wide | [(max-width: 599px)] narrow"
      styles="[(max-width: 599px)] color: red"
      attributes="[(min-width: 600px)] data-size=wide | [(max-width: 599px)] data-size=narrow"
    ><div id="probe" class="from-markup"></div></attribute-provider>
  `);
  const provider = document.querySelector("attribute-provider");
  const probe = document.getElementById("probe");
  await tick();
  assert.deepEqual([...probe.classList], ["from-markup", "base", "wide"], "adds to the child's own classes");
  assert.equal(probe.dataset.size, "wide");

  document.body.prepend(provider); // disconnect + reconnect
  await tick();
  window.happyDOM.setViewport({ width: 500 });
  await tick();
  assert.deepEqual([...probe.classList], ["from-markup", "base", "narrow"], "still live after a move");
  assert.equal(probe.dataset.size, "narrow");
  assert.equal(probe.style.color, "red");
  window.happyDOM.setViewport({ width: 1024 });
  await tick();
});
