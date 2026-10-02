// Automated accessibility audits (axe-core) for every stable element, in
// its interesting states, and for every recipe page. These complement the
// hand-written ARIA assertions in each element's spec: axe catches whole
// classes of problems (missing names, invalid ARIA, contrast, nesting)
// consistently across everything.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mount } from "./helpers.mjs";

const STYLES = ["theme", "scatter-plot/index", "chernoff-face/index", "tabbed-ui/index", "stylable-select/index", "infinite-combo-box/index", "drill-menu/index", "code-color/index"];
const MODULES = [
  "src/tabbed-ui/global.mjs",
  "src/stylable-select/global.mjs",
  "src/infinite-combo-box/global.mjs",
  "src/hot-key/global.mjs",
  "src/drill-menu/global.mjs",
  "src/code-color/global.mjs",
  "src/frame-timer/global.mjs",
  "src/cyclable/attribute-cycler/global.mjs",
  "src/matchable/query-container/global.mjs",
  "src/matchable/attribute-provider/global.mjs",
  "src/scatter-plot/global.mjs",
  "src/chernoff-face/global.mjs",
  "src/draw-svg/global.mjs",
  "src/pixelable/global.mjs",
];

// Element fixtures are fragments, not pages: page-level rules (a main
// landmark, a level-one heading, everything inside a region) don't apply.
const FRAGMENT_RULES = ["landmark-one-main", "page-has-heading-one", "region"];

const audit = async (page, { fragment = true } = {}) => {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]);
  if (fragment) builder.disableRules(FRAGMENT_RULES);
  const { violations } = await builder.analyze();
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
};

const loadStyles = (page) =>
  page.evaluate(async (styles) => {
    await Promise.all(
      styles.map(
        (name) =>
          new Promise((resolve) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `/src/${name}.css`;
            link.onload = link.onerror = resolve;
            document.head.append(link);
          }),
      ),
    );
  }, STYLES);

const ALL = `
  <tabbed-ui>
    <div aria-label="Sections"><button>One</button><button aria-disabled="true">Two</button><button>Three</button></div>
    <section>First</section><section>Second</section><section>Third</section>
  </tabbed-ui>
  <form>
    <label for="s">Fruit</label>
    <stylable-select id="s" name="fruit" required>
      <optgroup label="Common"><option value="a">Apple</option><option value="b" selected>Banana</option></optgroup>
      <optgroup label="Rare" disabled><option>Durian</option></optgroup>
    </stylable-select>
    <label for="c">City</label>
    <infinite-combo-box id="c" name="city" placeholder="Search"><option>Paris</option><option>Tokyo</option></infinite-combo-box>
  </form>
  <drill-menu aria-label="Settings">
    <button data-key="p">Profile<template><h2>Profile</h2><button data-back>Back</button></template></button>
    <a href="#help">Help</a>
  </drill-menu>
  <hot-key hotkey="mod+k"><dialog aria-label="Palette"><p>Hi</p></dialog></hot-key>
  <attribute-cycler values="light,dark"><button type="button" value="light">Light</button><button type="button" value="dark">Dark</button> <output></output></attribute-cycler>
  <code-color language="js"><pre>const answer = 42; // comment</pre></code-color>
  <query-container default="ul" query="[(min-width: 600px)] ol"><li>a</li><li>b</li></query-container>
  <attribute-provider classes="[(min-width: 1px)] note"><p>provided</p></attribute-provider>
  <frame-timer fps="10" paused></frame-timer>
  <chernoff-face smile="0.8"></chernoff-face>
  <pixel-canvas><pixel-palette colors="gameboy"><img src="/src/pixelable/pixel-canvas/scene.svg" alt="A sunset"></pixel-palette></pixel-canvas>
  <pixel-sprite alt="A heart">.8.8.\n88888\n.888.</pixel-sprite>
  <pixel-sprite>8</pixel-sprite>
  <pixel-canvas effects="halftone(4) crt()"><img src="/src/pixelable/pixel-canvas/scene.svg" alt="A sunset, printed"></pixel-canvas>
  <draw-svg><svg viewBox="0 0 10 10" role="img" aria-label="A line"><path d="M1 1 L9 9" stroke="black"></path></svg></draw-svg>
  <scatter-plot data='[[1, 2], {"x": 3, "y": 4, "title": "three"}]'></scatter-plot>`;

test("every stable element, at rest, passes axe", async ({ page }) => {
  await mount(page, ALL, MODULES);
  await loadStyles(page);
  expect(await audit(page)).toEqual([]);
});

test("open and active states pass axe too", async ({ page }) => {
  await mount(page, ALL, MODULES);
  await loadStyles(page);
  // combo box: list open with an active option
  await page.getByRole("combobox").fill("o");
  await page.keyboard.press("ArrowDown");
  // listbox: keyboard-active option
  await page.locator("#s").focus();
  await page.keyboard.press("ArrowDown");
  // drill menu: a screen open
  await page.getByRole("button", { name: "Profile" }).click();
  // tabs: a different panel
  await page.getByRole("tab", { name: "Three" }).click();
  expect(await audit(page)).toEqual([]);
  // dialog open
  await page.evaluate(() => document.querySelector("hot-key").show());
  expect(await audit(page)).toEqual([]);
});

test("disabled states pass axe", async ({ page }) => {
  await mount(page, ALL, MODULES);
  await loadStyles(page);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("tabbed-ui, stylable-select, infinite-combo-box, drill-menu, attribute-cycler")) {
      el.disabled = true;
    }
  });
  expect(await audit(page)).toEqual([]);
});

for (const recipe of ["theme-switcher", "command-palette", "settings-panel", "documentation-page", "game-loop"]) {
  test(`recipe: ${recipe} passes axe`, async ({ page }) => {
    await page.goto(`/examples/${recipe}.html`);
    await page.waitForTimeout(200);
    // Recipes are whole pages, but deliberately minimal ones without a
    // <main> landmark, so only the landmark rules are relaxed.
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .disableRules(["landmark-one-main", "region"])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  });
}
