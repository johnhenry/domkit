import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/draw-svg/global.mjs"];
const SVG = `<svg viewBox="0 0 100 100" width="100" height="100">
  <path id="a" d="M10 10 L90 90" stroke="black" fill="none" />
  <circle id="b" cx="50" cy="50" r="20" stroke="black" fill="none" pathLength="10" />
</svg>`;

const offsets = (page) =>
  page.evaluate(() => [...document.querySelectorAll("#a, #b")].map((el) => Math.round(parseFloat(getComputedStyle(el).strokeDashoffset) * 100) / 100));

test("normalizes each shape and animates its dash offset from hidden to drawn", async ({ page }) => {
  await mount(page, `<draw-svg id="d" duration="1000" paused>${SVG}</draw-svg>`, MODULES);
  const setup = await page.evaluate(() => {
    const d = document.getElementById("d");
    return {
      shapes: d.shapes.map((s) => s.id),
      pathLength: [document.getElementById("a").getAttribute("pathLength"), document.getElementById("b").getAttribute("pathLength")],
      generatedStyleElements: document.querySelectorAll("style").length,
    };
  });
  expect(setup).toEqual({ shapes: ["a", "b"], pathLength: ["1", "10"], generatedStyleElements: 0 });
  expect(await offsets(page), "paused at the start: hidden").toEqual([1, 1]);
  await page.evaluate(() => {
    for (const shape of document.getElementById("d").shapes) shape.getAnimations()[0].currentTime = 1000;
  });
  expect(await offsets(page), "at the end: drawn").toEqual([0, 0]);
});

test("play/pause events, the paused attribute, and ended", async ({ page }) => {
  await mount(page, `<draw-svg id="d" duration="150" paused>${SVG}</draw-svg>`, MODULES);
  const events = await page.evaluate(async () => {
    const d = document.getElementById("d");
    const seen = [];
    for (const type of ["play", "pause", "ended"]) d.addEventListener(type, () => seen.push(type));
    d.play();
    const playing = !d.paused;
    await new Promise((r) => d.addEventListener("ended", r, { once: true }));
    d.pause();
    d.removeAttribute("paused");
    return { seen, playing };
  });
  expect(events).toEqual({ seen: ["play", "ended", "pause", "play"], playing: true });
});

test("erase draws in and then wipes out; stagger offsets each shape", async ({ page }) => {
  await mount(page, `<draw-svg id="d" duration="1000" stagger="500" erase paused>${SVG}</draw-svg>`, MODULES);
  const timing = await page.evaluate(() =>
    document.getElementById("d").shapes.map((shape) => {
      const effect = shape.getAnimations()[0].effect;
      return { delay: effect.getTiming().delay, offsets: effect.getKeyframes().map((k) => parseFloat(k.strokeDashoffset)) };
    }),
  );
  expect(timing).toEqual([
    { delay: 0, offsets: [1, 0, -1] },
    { delay: 500, offsets: [1, 0, -1] },
  ]);
});

test("reduced motion shows the drawing as written, unanimated", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(page, `<draw-svg id="d">${SVG}</draw-svg>`, MODULES);
  const state = await page.evaluate(() => ({
    shapes: document.getElementById("d").shapes.length,
    animations: document.getAnimations().length,
    pathLength: document.getElementById("a").hasAttribute("pathLength"),
  }));
  expect(state).toEqual({ shapes: 0, animations: 0, pathLength: false });
});

test("removing it restores the SVG exactly as written", async ({ page }) => {
  await mount(page, `<div id="host"><draw-svg id="d">${SVG}</draw-svg></div>`, MODULES);
  const result = await page.evaluate(() => {
    const d = document.getElementById("d");
    const svg = d.querySelector("svg");
    d.remove();
    return {
      a: document.querySelector("#a") ? null : svg.querySelector("#a").outerHTML,
      b: svg.querySelector("#b").getAttribute("pathLength"),
      animations: svg.querySelector("#a").getAnimations().length,
    };
  });
  expect(result.a).toBe('<path id="a" d="M10 10 L90 90" stroke="black" fill="none"></path>');
  expect(result.b, "the author's own pathLength stays").toBe("10");
  expect(result.animations).toBe(0);
});

test("start=visible waits until it scrolls into view", async ({ page }) => {
  await mount(page, `<div style="height: 3000px"></div><draw-svg id="d" start="visible" duration="100">${SVG}</draw-svg>`, MODULES);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => document.getElementById("d").paused)).toBe(true);
  await page.evaluate(() => document.getElementById("d").scrollIntoView());
  await expect.poll(() => page.evaluate(() => document.getElementById("d").paused)).toBe(false);
});

test("commands drive it; shapes added later join in; select narrows", async ({ page }) => {
  await mount(page, `<draw-svg id="d" paused select="path">${SVG}</draw-svg>`, MODULES);
  const result = await page.evaluate(async () => {
    const d = document.getElementById("d");
    const send = (command) => d.dispatchEvent(Object.assign(new Event("command"), { command }));
    const selected = d.shapes.map((s) => s.id);
    send("--toggle");
    const playing = !d.paused;
    send("--pause");
    d.querySelector("svg").insertAdjacentHTML("beforeend", '<path id="c" d="M0 0 L5 5" stroke="black" />');
    await new Promise((r) => setTimeout(r));
    return { selected, playing, paused: d.paused, after: d.shapes.map((s) => s.id) };
  });
  expect(result).toEqual({ selected: ["a"], playing: true, paused: true, after: ["a", "c"] });
});
