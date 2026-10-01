import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

const clamp = (await import("../src/clamp/index.mjs")).default;
const delay = (await import("../src/delay/index.mjs")).default;
const frameDelay = (await import("../src/frame-delay/index.mjs")).default;
const { default: createMutableNodeList, MutableNodeList } = await import(
  "../src/create-mutable-nodelist/index.mjs"
);
const liveQuerySelector = (await import("../src/live-query-selector/index.mjs"))
  .default;

test("clamp is curried and bounds both ends", () => {
  const pct = clamp(0, 100);
  assert.equal(pct(150), 100);
  assert.equal(pct(-10), 0);
  assert.equal(pct(42), 42);
});

test("delay resolves with its value, after a timeout or a microtask", async () => {
  assert.equal(await delay(5, "done"), "done");
  let microtaskRan = false;
  const p = delay(undefined, 1).then(() => (microtaskRan = true));
  assert.equal(microtaskRan, false);
  await p;
  assert.equal(microtaskRan, true);
});

test("frame-delay accepts any positive fps and rejects the rest", async () => {
  assert.throws(() => frameDelay(0), RangeError);
  assert.throws(() => frameDelay(-5), RangeError);
  assert.equal(await frameDelay(60, "v"), "v");
  assert.equal(await frameDelay(7, "any rate"), "any rate");
});

test("create-mutable-nodelist is a NodeList you can push/pop/shift/unshift", () => {
  const [a, b, c] = ["a", "b", "c"].map((t) => document.createElement(t));
  const list = createMutableNodeList(a);
  assert.ok(list instanceof NodeList);
  assert.ok(list instanceof MutableNodeList);
  assert.equal(list.push(b), 2);
  assert.equal(list.unshift(c), 3);
  assert.deepEqual([...list], [c, a, b]);
  assert.equal(list.item(), c);
  assert.equal(list.shift(), c);
  assert.equal(list.pop(), b);
  assert.deepEqual([...list], [a]);
  assert.throws(() => list.push("not a node"));
  assert.throws(() => new MutableNodeList());
});

test("live-query-selector tracks additions/removals until stopped", async () => {
  const root = render(`<ul id="l"><li class="x"></li></ul>`).querySelector("#l");
  const live = liveQuerySelector("li.x", root);
  assert.equal(live.length, 1);
  root.insertAdjacentHTML("beforeend", `<li class="x"></li><li></li>`);
  await tick();
  assert.equal(live.length, 2);
  live.stop();
  root.insertAdjacentHTML("beforeend", `<li class="x"></li>`);
  await tick();
  assert.equal(live.length, 2, "no updates after stop()");
  assert.ok(!Object.keys(live).includes("stop"), "stop is non-enumerable");
});

test("live-query-selector can return a MutableNodeList", () => {
  render(`<p></p><p></p>`);
  const live = liveQuerySelector("p", document, true);
  assert.ok(live instanceof NodeList);
  assert.equal(live.length, 2);
  live.stop();
});
