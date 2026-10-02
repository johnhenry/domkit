import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/chernoff-face/global.mjs", "src/scatter-plot/global.mjs"];

test("draws an SVG face in the light DOM, 4em square without CSS", async ({ page }) => {
  await mount(page, `<chernoff-face id="f"></chernoff-face>`, MODULES);
  const result = await page.evaluate(() => {
    const f = document.getElementById("f");
    const box = f.getBoundingClientRect();
    const em = parseFloat(getComputedStyle(f).fontSize);
    return {
      parts: [...f.querySelectorAll("svg > *")].map((el) => el.getAttribute("class")),
      square: Math.round(box.width) === Math.round(4 * em) && Math.round(box.height) === Math.round(4 * em),
      role: f.getAttribute("role"),
    };
  });
  expect(result).toEqual({
    parts: ["face", "eye", "eye", "pupil", "pupil", "brow", "brow", "nose", "mouth"],
    square: true,
    role: "img",
  });
});

test("features map 0–1 onto the drawing, update in place, and clamp", async ({ page }) => {
  await mount(page, `<chernoff-face id="f"></chernoff-face>`, MODULES);
  const result = await page.evaluate(() => {
    const f = document.getElementById("f");
    const svg = f.querySelector("svg");
    const eye = () => Number(f.querySelector(".eye").getAttribute("rx"));
    const small = (f.setAttribute("eye-size", "0"), eye());
    const large = (f.setAttribute("eye-size", "1"), eye());
    f.setAttribute("eye-size", "7");
    const clamped = eye();
    f.setAttribute("eye-size", "nonsense");
    const neutral = f.features.eyeSize;
    f.setAttribute("smile", "1");
    const smiling = f.querySelector(".mouth").getAttribute("d");
    f.setAttribute("smile", "0");
    const frowning = f.querySelector(".mouth").getAttribute("d");
    f.setAttribute("mouth-open", "1");
    return { small, large, clamped, neutral, smiling, frowning, open: f.querySelector(".mouth").hasAttribute("data-open"), same: f.querySelector("svg") === svg };
  });
  expect(result.small).toBeLessThan(result.large);
  expect(result.clamped).toBe(result.large);
  expect(result.neutral).toBe(0.5);
  expect(result.smiling).toContain("Q 128 244"); // middle bends down: a smile
  expect(result.frowning).toContain("Q 128 140");
  expect(result.open).toBe(true);
  expect(result.same, "updated in place").toBe(true);
});

test("the features property reads all and writes some", async ({ page }) => {
  await mount(page, `<chernoff-face id="f" smile="0.9"></chernoff-face>`, MODULES);
  const result = await page.evaluate(() => {
    const f = document.getElementById("f");
    const read = f.features;
    f.features = { eyeSize: 0.25, "mouth-open": 1 };
    return { read, attrs: [f.getAttribute("eye-size"), f.getAttribute("mouth-open"), f.getAttribute("smile")] };
  });
  expect(result.read).toMatchObject({ smile: 0.9, eyeSize: 0.5, faceWidth: 0.5 });
  expect(Object.keys(result.read)).toHaveLength(10);
  expect(result.attrs).toEqual(["0.25", "1", "0.9"]);
});

test("labels itself with its notable features unless the author labels it", async ({ page }) => {
  await mount(page, `<chernoff-face id="f"></chernoff-face><chernoff-face id="g" aria-label="Team A" smile="1"></chernoff-face>`, MODULES);
  const labels = await page.evaluate(() => {
    const f = document.getElementById("f");
    const neutral = f.getAttribute("aria-label");
    f.setAttribute("smile", "0.9");
    const smiling = f.getAttribute("aria-label");
    return { neutral, smiling, authored: document.getElementById("g").getAttribute("aria-label") };
  });
  expect(labels).toEqual({ neutral: "Face, every feature neutral", smiling: "Face: smile 0.9", authored: "Team A" });
});

test("works as a scatter-plot point, with data keys as features", async ({ page }) => {
  await mount(
    page,
    `<scatter-plot id="p" x-max="10" y-max="10" data='[{"x": 2, "y": 3, "smile": 1, "aria-label": "A"}, {"x": 8, "y": 7, "smile": 0}]'>
       <template><chernoff-face></chernoff-face></template>
     </scatter-plot>`,
    MODULES,
  );
  const faces = await page.evaluate(() =>
    document.getElementById("p").points.map((face) => [face.localName, face.features.smile, face.querySelectorAll("svg").length, face.getAttribute("aria-label")]),
  );
  expect(faces).toEqual([["chernoff-face", 1, 1, "A"], ["chernoff-face", 0, 1, "Face: smile 0"]]);
});

test("survives a move without duplicating its drawing", async ({ page }) => {
  await mount(page, `<div id="a"><chernoff-face id="f" smile="1"></chernoff-face></div><div id="b"></div>`, MODULES);
  const count = await page.evaluate(() => {
    const f = document.getElementById("f");
    document.getElementById("b").append(f);
    const built = document.createElement("chernoff-face");
    document.body.append(built);
    return [f.querySelectorAll("svg").length, built.querySelectorAll("svg").length];
  });
  expect(count).toEqual([1, 1]);
});
