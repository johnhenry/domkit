// matchable's container mode: the query evaluator is pure, so test it here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileQuery } from "../src/matchable/container-query.mjs";

const size = (width, height = 300) => ({ width, height, em: 20, rem: 16 });
const matches = (query, ...sizes) => sizes.map((s) => compileQuery(query)(s));

test("min-/max- features and exact values", () => {
  assert.deepEqual(matches("(min-width: 400px)", size(399), size(400), size(800)), [false, true, true]);
  assert.deepEqual(matches("(max-width: 400px)", size(399), size(400), size(401)), [true, true, false]);
  assert.deepEqual(matches("(min-height: 200px)", size(100, 199), size(100, 200)), [false, true]);
  assert.deepEqual(matches("(min-inline-size: 300px)", size(299), size(300)), [false, true]);
});

test("range syntax, both directions and two-sided", () => {
  assert.deepEqual(matches("(width >= 400px)", size(399), size(400)), [false, true]);
  assert.deepEqual(matches("(width < 400px)", size(399), size(400)), [true, false]);
  assert.deepEqual(matches("(400px < width)", size(400), size(401)), [false, true]);
  assert.deepEqual(matches("(400px <= width < 800px)", size(399), size(400), size(799), size(800)), [false, true, true, false]);
});

test("and, or, comma lists, not, media types", () => {
  assert.deepEqual(matches("(min-width: 400px) and (max-width: 600px)", size(300), size(500), size(700)), [false, true, false]);
  assert.deepEqual(matches("(max-width: 300px) or (min-width: 700px)", size(200), size(500), size(800)), [true, false, true]);
  assert.deepEqual(matches("(max-width: 300px), (min-width: 700px)", size(200), size(500)), [true, false]);
  assert.deepEqual(matches("not (min-width: 400px)", size(300), size(500)), [true, false]);
  assert.deepEqual(matches("screen and (min-width: 400px)", size(500)), [true]);
  assert.deepEqual(matches("print", size(500)), [false]);
  assert.deepEqual(matches("((max-width: 100px) or (min-width: 900px)) and (min-height: 1px)", size(50), size(500)), [true, false]);
});

test("orientation, aspect-ratio, units", () => {
  assert.deepEqual(matches("(orientation: portrait)", size(200, 300), size(400, 300)), [true, false]);
  assert.deepEqual(matches("(orientation: landscape)", size(400, 300)), [true]);
  assert.deepEqual(matches("(min-aspect-ratio: 16/9)", size(1600, 900), size(1000, 900)), [true, false]);
  assert.deepEqual(matches("(min-width: 20em)", size(399), size(400)), [false, true], "em = container font size (20px)");
  assert.deepEqual(matches("(min-width: 25rem)", size(399), size(400)), [false, true], "rem = root font size (16px)");
});

test("empty matches; unknown features and invalid lengths never match", () => {
  assert.deepEqual(matches("", size(1)), [true]);
  assert.deepEqual(matches("(hover: hover)", size(500)), [false]);
  assert.deepEqual(matches("(min-width: 400)", size(500)), [false], "unitless non-zero length is invalid");
  assert.deepEqual(matches("(min-width: 0)", size(0)), [true]);
});
