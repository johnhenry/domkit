import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

const clamp = (await import("../src/clamp/index.mjs")).default;
const delay = (await import("../src/delay/index.mjs")).default;
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

test("delay({ fps }) waits a frame period; a non-positive fps rejects", async () => {
  await assert.rejects(delay({ fps: 0 }), RangeError);
  await assert.rejects(delay({ fps: -5 }), RangeError);
  await assert.rejects(delay({}), RangeError);
  assert.equal(await delay({ fps: 60 }, "v"), "v");
  assert.equal(await delay({ fps: 7 }, "any rate"), "any rate");
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

test("live-query-selector fires change only when its matches change", async () => {
  const root = render(`<ul id="l"><li class="x"></li></ul>`).querySelector("#l");
  const live = liveQuerySelector("li.x", root);
  let changes = 0;
  live.addEventListener("change", () => changes++);
  root.insertAdjacentHTML("beforeend", `<li></li>`);
  await tick();
  assert.equal(changes, 0, "a non-matching addition isn't a change");
  root.insertAdjacentHTML("beforeend", `<li class="x"></li>`);
  await tick();
  assert.equal(changes, 1);
  assert.ok(Array.isArray(live));
  assert.deepEqual(Object.keys(live), ["0", "1"], "the extras are non-enumerable");
  live.stop();
});
