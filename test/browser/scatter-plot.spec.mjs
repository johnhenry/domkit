import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/scatter-plot/global.mjs"];

// Each point's position as [left %, bottom %], rounded.
const positions = (page, id = "p") =>
  page.evaluate((id) =>
    document.getElementById(id).points.map((point) => [
      Math.round(parseFloat(point.style.left)),
      Math.round(parseFloat(point.style.bottom)),
    ]), id);

test("plots [x, y] pairs and {x, y} objects by percentage, in the light DOM", async ({ page }) => {
  await mount(
    page,
    `<scatter-plot id="p" x-max="10" y-max="10" style="width: 200px; height: 100px"
       data='[[0, 0], [5, 5], {"x": 10, "y": 10, "class": "peak", "title": "top"}]'></scatter-plot>`,
    MODULES,
  );
  expect(await positions(page)).toEqual([[0, 0], [50, 50], [100, 100]]);
  const third = await page.evaluate(() => {
    const point = document.getElementById("p").points[2];
    return { class: point.className, title: point.title, x: point.dataset.x, inLightDom: point.closest("scatter-plot") !== null };
  });
  expect(third).toEqual({ class: "peak", title: "top", x: "10", inLightDom: true });
  // Laid out within the element, without index.css.
  const box = await page.evaluate(() => {
    const plot = document.getElementById("p").getBoundingClientRect();
    const last = document.getElementById("p").points[2].getBoundingClientRect();
    return { right: Math.round(last.left + last.width / 2 - plot.left), top: Math.round(plot.bottom - (last.top + last.height / 2)) };
  });
  expect(box).toEqual({ right: 200, top: 100 });
});

test("clones a <template> point; without one, a default [data-point]", async ({ page }) => {
  await mount(
    page,
    `<scatter-plot id="a" data="[[1, 1]]"><template><b class="dot">•</b></template></scatter-plot>
     <scatter-plot id="b" data="[[1, 1]]"></scatter-plot>`,
    MODULES,
  );
  expect(await page.evaluate(() => [document.getElementById("a").points[0].outerHTML.startsWith('<b class="dot"'), document.getElementById("b").points[0].hasAttribute("data-point")])).toEqual([true, true]);
});

test("the domain defaults to the data (from 0), and the attributes override it", async ({ page }) => {
  await mount(page, `<scatter-plot id="p" data="[[2, 4], [8, -4]]"></scatter-plot>`, MODULES);
  expect(await page.evaluate(() => document.getElementById("p").domain)).toEqual({ xMin: 0, xMax: 8, yMin: -4, yMax: 4 });
  expect(await positions(page)).toEqual([[25, 100], [100, 0]]);
  await page.evaluate(() => {
    const p = document.getElementById("p");
    p.setAttribute("x-min", "2");
    p.setAttribute("y-max", "12");
  });
  expect(await page.evaluate(() => document.getElementById("p").domain)).toEqual({ xMin: 2, xMax: 8, yMin: -4, yMax: 12 });
  expect(await positions(page)).toEqual([[0, 50], [100, 0]]);
});

test("the data property replots without touching the attribute; bad JSON fires error and keeps the old plot", async ({ page }) => {
  await mount(page, `<scatter-plot id="p" data="[[1, 1]]" x-max="4" y-max="4"></scatter-plot>`, MODULES);
  const result = await page.evaluate(() => {
    const p = document.getElementById("p");
    const errors = [];
    p.addEventListener("error", (e) => errors.push(e.message));
    p.data = [[2, 2], [4, 4], ["x", 1], null];
    const afterProperty = { count: p.points.length, attr: p.getAttribute("data") };
    p.setAttribute("data", "{not json");
    p.setAttribute("data", '{"x": 1}');
    return { afterProperty, errors: errors.length, count: p.points.length };
  });
  expect(result).toEqual({ afterProperty: { count: 2, attr: "[[1, 1]]" }, errors: 2, count: 2 });
});

test("has a text alternative: generated, unless the author writes one", async ({ page }) => {
  await mount(
    page,
    `<scatter-plot id="p" data="[[1, 2], [3, 4]]"></scatter-plot>
     <scatter-plot id="q" aria-label="Weekly sales" data="[[1, 2]]"></scatter-plot>`,
    MODULES,
  );
  const labels = await page.evaluate(() => {
    const p = document.getElementById("p");
    const first = p.getAttribute("aria-label");
    p.data = [[1, 1]];
    const updated = p.getAttribute("aria-label");
    p.setAttribute("aria-label", "Mine");
    p.data = [[1, 1], [2, 2]];
    return { role: p.getAttribute("role"), first, updated, kept: p.getAttribute("aria-label"), authored: document.getElementById("q").getAttribute("aria-label") };
  });
  expect(labels).toEqual({
    role: "img",
    first: "Scatter plot of 2 points, x from 0 to 3, y from 0 to 4",
    updated: "Scatter plot of 1 point, x from 0 to 1, y from 0 to 1",
    kept: "Mine",
    authored: "Weekly sales",
  });
});

test("a template added later replots; survives a move and every creation path", async ({ page }) => {
  await mount(page, `<div id="a"><scatter-plot id="p" data="[[1, 1], [2, 2]]"></scatter-plot></div><div id="b"></div>`, MODULES);
  const result = await page.evaluate(async () => {
    const p = document.getElementById("p");
    p.insertAdjacentHTML("afterbegin", "<template><i class='star'></i></template>");
    await new Promise((r) => setTimeout(r));
    const swapped = p.points.every((point) => point.matches("i.star"));
    document.getElementById("b").append(p);
    const layers = p.querySelectorAll("[data-points]").length;
    const built = document.createElement("scatter-plot");
    built.data = [[3, 3]];
    document.body.append(built);
    return { swapped, layers, moved: p.points.length, built: built.points.length };
  });
  expect(result).toEqual({ swapped: true, layers: 1, moved: 2, built: 1 });
});
