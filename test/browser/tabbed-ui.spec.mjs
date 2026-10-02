import { test, expect } from "@playwright/test";
import { mount, recordEvents } from "./helpers.mjs";

const MODULES = ["src/tabbed-ui/global.mjs"];
const TABS = `
  <tabbed-ui id="t">
    <div>
      <button id="a">A</button>
      <button id="b">B</button>
      <button id="c">C</button>
    </div>
    <section id="pa">Panel A</section>
    <section id="pb">Panel B <a href="#">link</a></section>
    <section id="pc">Panel C</section>
  </tabbed-ui>`;

const state = (page) =>
  page.evaluate(() => {
    const t = document.querySelector("tabbed-ui");
    return {
      index: t.selectedIndex,
      attr: t.getAttribute("selected-index"),
      selected: t.tabs.map((tab) => tab.getAttribute("aria-selected")),
      tabindex: t.tabs.map((tab) => tab.tabIndex),
      hidden: t.panels.map((panel) => panel.hidden),
    };
  });

test("wires the WAI-ARIA tabs pattern onto plain markup", async ({ page }) => {
  await mount(page, TABS, MODULES);
  const tablist = page.getByRole("tablist");
  await expect(tablist).toHaveCount(1);
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "A" })).toBeVisible();
  await expect(page.locator("#pb")).toBeHidden();
  const wiring = await page.evaluate(() => {
    const t = document.querySelector("tabbed-ui");
    return t.tabs.every(
      (tab, i) =>
        tab.getAttribute("aria-controls") === t.panels[i].id &&
        t.panels[i].getAttribute("aria-labelledby") === tab.id,
    );
  });
  expect(wiring).toBe(true);
  expect(await state(page)).toMatchObject({
    index: 0,
    attr: "0",
    tabindex: [0, -1, -1],
    hidden: [false, true, true],
  });
});

test("hides panels with the hidden attribute, so author CSS stays in control", async ({ page }) => {
  await mount(page, TABS, MODULES);
  expect(await page.evaluate(() => document.getElementById("pb").getAttribute("style"))).toBeNull();
  expect(await page.evaluate(() => document.getElementById("pb").hasAttribute("hidden"))).toBe(true);
});

test("clicking a tab selects it and fires change", async ({ page }) => {
  await mount(page, TABS, MODULES);
  const events = await recordEvents(page, ["change"]);
  await page.getByRole("tab", { name: "B" }).click();
  expect(await state(page)).toMatchObject({ index: 1, attr: "1", hidden: [true, false, true] });
  expect(await events.take()).toEqual([["change", "t"]]);
  await page.getByRole("tab", { name: "B" }).click();
  expect(await events.take()).toEqual([], "re-selecting the same tab is not a change");
});

test("arrow keys, Home, and End move and select (automatic activation)", async ({ page }) => {
  await mount(page, TABS, MODULES);
  await page.getByRole("tab", { name: "A" }).focus();
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).index).toBe(1);
  await expect(page.getByRole("tab", { name: "B" })).toBeFocused();
  await page.keyboard.press("End");
  expect((await state(page)).index).toBe(2);
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).index, "wraps").toBe(0);
  await page.keyboard.press("ArrowLeft");
  expect((await state(page)).index, "wraps back").toBe(2);
  await page.keyboard.press("Home");
  expect((await state(page)).index).toBe(0);
});

test("Tab moves from the selected tab into its panel", async ({ page }) => {
  await mount(page, TABS, MODULES);
  await page.getByRole("tab", { name: "A" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#pa")).toBeFocused();
});

test("manual activation: arrows move focus, Enter/Space selects", async ({ page }) => {
  await mount(page, TABS.replace('<tabbed-ui id="t">', '<tabbed-ui id="t" manual>'), MODULES);
  await page.getByRole("tab", { name: "A" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "B" })).toBeFocused();
  expect((await state(page)).index).toBe(0);
  await page.keyboard.press("Enter");
  expect((await state(page)).index).toBe(1);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press(" ");
  expect((await state(page)).index).toBe(2);
});

test("disabled tabs are skipped and can't be selected", async ({ page }) => {
  await mount(page, TABS.replace('<button id="b">', '<button id="b" aria-disabled="true">'), MODULES);
  await page.getByRole("tab", { name: "A" }).focus();
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).index).toBe(2);
  // force: Playwright won't click an aria-disabled element on its own
  await page.getByRole("tab", { name: "B" }).click({ force: true });
  expect((await state(page)).index).toBe(2);
});

test("vertical tab lists use up/down", async ({ page }) => {
  await mount(page, TABS.replace("<div>", '<div aria-orientation="vertical">'), MODULES);
  await page.getByRole("tab", { name: "A" }).focus();
  await page.keyboard.press("ArrowDown");
  expect((await state(page)).index).toBe(1);
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).index, "left/right ignored").toBe(1);
});

test("selected-index and selectedIndex reflect, and script changes don't fire change", async ({ page }) => {
  await mount(page, TABS.replace('<tabbed-ui id="t">', '<tabbed-ui id="t" selected-index="2">'), MODULES);
  expect((await state(page)).index).toBe(2);
  const events = await recordEvents(page, ["change"]);
  await page.evaluate(() => (document.querySelector("tabbed-ui").selectedIndex = 1));
  expect(await state(page)).toMatchObject({ index: 1, attr: "1" });
  await page.evaluate(() => document.querySelector("tabbed-ui").setAttribute("selected-index", "0"));
  expect((await state(page)).index).toBe(0);
  await page.evaluate(() => (document.querySelector("tabbed-ui").selectedIndex = 99));
  expect((await state(page)).index, "clamps").toBe(2);
  expect(await events.take()).toEqual([]);
});

test("an authored aria-selected tab is the initial selection", async ({ page }) => {
  await mount(page, TABS.replace('<button id="c">', '<button id="c" aria-selected="true">'), MODULES);
  expect((await state(page)).index).toBe(2);
});

test("an explicit role=tablist child is the tab list, wherever it is", async ({ page }) => {
  await mount(
    page,
    `<tabbed-ui><section>One</section><nav role="tablist"><button>1</button><button>2</button></nav><section>Two</section></tabbed-ui>`,
    MODULES,
  );
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByRole("tabpanel", { name: "1" })).toHaveText("One");
});

test("tabs and panels added later are wired up", async ({ page }) => {
  await mount(page, TABS, MODULES);
  await page.evaluate(() => {
    const t = document.querySelector("tabbed-ui");
    t.tabList.insertAdjacentHTML("beforeend", "<button>D</button>");
    t.insertAdjacentHTML("beforeend", "<section id='pd'>Panel D</section>");
  });
  await page.getByRole("tab", { name: "D" }).click();
  await expect(page.locator("#pd")).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "D" })).toHaveCount(1);
});

test("survives a move, and works however it was created", async ({ page }) => {
  await mount(page, TABS, MODULES);
  await page.evaluate(() => {
    const t = document.querySelector("tabbed-ui");
    t.selectedIndex = 1;
    document.body.prepend(t); // disconnect + reconnect
  });
  expect((await state(page)).index).toBe(1);
  await page.getByRole("tab", { name: "C" }).click();
  expect((await state(page)).index).toBe(2);

  // createElement, attributes before children, appended last
  const built = await page.evaluate(() => {
    const t = document.createElement("tabbed-ui");
    t.setAttribute("selected-index", "1");
    t.innerHTML = "<div><button>x</button><button>y</button></div><p>X</p><p>Y</p>";
    document.body.replaceChildren(t);
    return { index: t.selectedIndex, hidden: t.panels.map((p) => p.hidden) };
  });
  expect(built).toEqual({ index: 1, hidden: [true, false] });
});

test("nested tabbed-ui elements stay independent", async ({ page }) => {
  await mount(
    page,
    `<tabbed-ui id="outer"><div><button>O1</button><button>O2</button></div>
       <section><tabbed-ui id="inner"><div><button>I1</button><button>I2</button></div><p>i1</p><p>i2</p></tabbed-ui></section>
       <section>o2</section></tabbed-ui>`,
    MODULES,
  );
  await page.getByRole("tab", { name: "I2" }).click();
  const indexes = await page.evaluate(() => [
    document.getElementById("outer").selectedIndex,
    document.getElementById("inner").selectedIndex,
  ]);
  expect(indexes).toEqual([0, 1]);
});

test("before upgrade, every panel is readable", async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  await page.evaluate(() => {
    document.body.innerHTML = `<tabbed-ui><div><button>A</button></div><section id="p1">One</section><section id="p2">Two</section></tabbed-ui>`;
  });
  await expect(page.locator("#p1")).toBeVisible();
  await expect(page.locator("#p2")).toBeVisible();
});

test.describe("next(), previous(), and invoker commands", () => {
  const command = (page, name, value) =>
    page.evaluate(([name, value]) => {
      const source = Object.assign(document.createElement("button"), { value: value ?? "" });
      const event = Object.assign(new Event("command", { cancelable: true }), { command: name, source });
      document.getElementById("t").dispatchEvent(event);
    }, [name, value]);

  test("next()/previous() wrap, skip disabled tabs, and are silent", async ({ page }) => {
    await mount(page, TABS.replace('<button id="b">', '<button id="b" disabled>'), MODULES);
    const events = await recordEvents(page, ["change"]);
    const index = () => page.evaluate(() => document.getElementById("t").selectedIndex);
    await page.evaluate(() => document.getElementById("t").next());
    expect(await index(), "skips the disabled B").toBe(2);
    await page.evaluate(() => document.getElementById("t").next());
    expect(await index(), "wraps").toBe(0);
    await page.evaluate(() => document.getElementById("t").previous());
    expect(await index()).toBe(2);
    expect(await events.take()).toEqual([]);
  });

  test("--next, --previous, and --select drive it from anywhere, firing change", async ({ page }) => {
    await mount(page, TABS, MODULES);
    const events = await recordEvents(page, ["change"]);
    await command(page, "--next");
    expect((await state(page)).index).toBe(1);
    await command(page, "--previous");
    expect((await state(page)).index).toBe(0);
    await command(page, "--select", "2");
    expect((await state(page)).index).toBe(2);
    await command(page, "--select", "9");
    expect((await state(page)).index, "an out-of-range index is ignored").toBe(2);
    expect(await events.take()).toEqual([["change", "t"], ["change", "t"], ["change", "t"]]);
    await page.evaluate(() => (document.getElementById("t").disabled = true));
    await command(page, "--next");
    expect((await state(page)).index, "disabled ignores commands").toBe(2);
  });

  test("a real commandfor button works, where supported", async ({ page }) => {
    await mount(page, `${TABS}<button id="go" commandfor="t" command="--next">Next step</button>`, MODULES);
    const supported = await page.evaluate(() => "command" in HTMLButtonElement.prototype);
    test.skip(!supported, "this engine doesn't support invoker commands yet");
    await page.locator("#go").click();
    expect((await state(page)).index).toBe(1);
  });
});
