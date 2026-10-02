import { test, expect } from "@playwright/test";
import { mount, recordEvents } from "./helpers.mjs";

const MODULES = ["src/cyclable/attribute-cycler/global.mjs"];
const THEME = `
  <attribute-cycler id="theme" target="html" values="light,dark,system" storage-key="test-theme">
    <button id="next">Next theme</button>
    <button id="prev" data-cycle="previous">Previous</button>
    <button value="dark" id="dark">Dark</button>
    <output id="out"></output>
  </attribute-cycler>`;

const state = (page) =>
  page.evaluate(() => ({
    html: document.documentElement.className,
    value: document.getElementById("theme").value,
    attr: document.getElementById("theme").getAttribute("value"),
    out: document.getElementById("out")?.value,
    stored: localStorage.getItem("test-theme"),
    darkPressed: document.getElementById("dark")?.getAttribute("aria-pressed"),
  }));

test.beforeEach(async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  await page.evaluate(() => localStorage.clear());
});

test("applies the first value, reflects it, and shows it in an <output>", async ({ page }) => {
  await mount(page, THEME, MODULES);
  expect(await state(page)).toMatchObject({ html: "light", value: "light", attr: "light", out: "light", darkPressed: "false" });
});

test("buttons inside cycle forward/back or set a value, firing change", async ({ page }) => {
  await mount(page, THEME, MODULES);
  const events = await recordEvents(page, ["change"]);
  await page.locator("#next").click();
  expect(await state(page)).toMatchObject({ html: "dark", out: "dark", stored: "dark", darkPressed: "true" });
  await page.locator("#next").click();
  await page.locator("#next").click();
  expect((await state(page)).value, "wraps").toBe("light");
  await page.locator("#prev").click();
  expect((await state(page)).value).toBe("system");
  await page.locator("#dark").click();
  await page.locator("#dark").click();
  expect((await state(page)).value).toBe("dark");
  expect((await events.take()).length, "no change event when the value didn't change").toBe(5);
});

test("the stored value survives a reload; the value attribute is the fallback", async ({ page }) => {
  await mount(page, THEME, MODULES);
  await page.locator("#next").click();
  await mount(page, THEME, MODULES);
  expect((await state(page)).value).toBe("dark");
  await page.evaluate(() => localStorage.clear());
  await mount(page, THEME.replace('storage-key="test-theme"', 'storage-key="test-theme" value="system"'), MODULES);
  expect((await state(page)).value).toBe("system");
});

test("stays in sync with other tabs through storage events", async ({ page, context }) => {
  await mount(page, THEME, MODULES);
  const other = await context.newPage();
  await mount(other, THEME, MODULES);
  await other.locator("#next").click();
  await expect.poll(() => state(page).then((s) => s.value)).toBe("dark");
  expect((await state(page)).html).toBe("dark");
});

test("script changes are silent; next()/previous()/value work", async ({ page }) => {
  await mount(page, THEME, MODULES);
  const events = await recordEvents(page, ["change"]);
  await page.evaluate(() => {
    const t = document.getElementById("theme");
    t.next();
    t.next();
    t.previous();
  });
  expect((await state(page)).value).toBe("dark");
  await page.evaluate(() => (document.getElementById("theme").value = "system"));
  await page.evaluate(() => document.getElementById("theme").setAttribute("value", "light"));
  expect(await state(page)).toMatchObject({ value: "light", html: "light" });
  await page.evaluate(() => (document.getElementById("theme").value = "nope"));
  expect((await state(page)).value, "unknown values are ignored").toBe("light");
  expect(await events.take()).toEqual([]);
});

test("other classes on the target are left alone; an empty value means no class", async ({ page }) => {
  await mount(
    page,
    `<div id="box" class="keep"></div><attribute-cycler id="theme" target="#box" values=",highlight"><button id="next">x</button></attribute-cycler>`,
    MODULES,
  );
  const cls = () => page.evaluate(() => document.getElementById("box").className);
  expect(await cls()).toBe("keep");
  await page.locator("#next").click();
  expect(await cls()).toBe("keep highlight");
  await page.locator("#next").click();
  expect(await cls()).toBe("keep");
});

test("changing target moves the class", async ({ page }) => {
  await mount(page, `<p id="a"></p><p id="b"></p><attribute-cycler id="theme" target="#a" values="x,y"></attribute-cycler>`, MODULES);
  await page.evaluate(() => document.getElementById("theme").setAttribute("target", "#b"));
  expect(await page.evaluate(() => [document.getElementById("a").className, document.getElementById("b").className])).toEqual(["", "x"]);
});

test.describe("attribute", () => {
  test("sets any attribute's whole value; an empty value removes it", async ({ page }) => {
    await mount(
      page,
      `<div id="box" data-theme="mine"></div>
       <attribute-cycler id="c" target="#box" attribute="data-theme" values=",dark,light"><button id="next">x</button></attribute-cycler>`,
      MODULES,
    );
    const attr = () => page.evaluate(() => document.getElementById("box").getAttribute("data-theme"));
    expect(await attr(), "the empty first value: the attribute isn't one of ours, so it's left").toBe("mine");
    await page.locator("#next").click();
    expect(await attr()).toBe("dark");
    await page.locator("#next").click();
    expect(await attr()).toBe("light");
    await page.locator("#next").click();
    expect(await attr(), "back to empty: ours is removed").toBe(null);
  });

  test("changing attribute moves the value, and leaves the class alone", async ({ page }) => {
    await mount(
      page,
      `<div id="box" class="keep"></div><attribute-cycler id="c" target="#box" values="a,b" value="b"></attribute-cycler>`,
      MODULES,
    );
    const read = () => page.evaluate(() => {
      const box = document.getElementById("box");
      return [box.className, box.getAttribute("data-mode")];
    });
    expect(await read()).toEqual(["keep b", null]);
    await page.evaluate(() => (document.getElementById("c").attribute = "data-mode"));
    expect(await read()).toEqual(["keep", "b"]);
    await page.evaluate(() => document.getElementById("c").removeAttribute("attribute"));
    expect(await read()).toEqual(["keep b", null]);
  });
});

test.describe("reset", () => {
  test("reset() forgets the stored value and returns to the authored default, silently", async ({ page }) => {
    await mount(
      page,
      `<attribute-cycler id="theme" target="html" values="light,dark,system" value="system" storage-key="test-theme"><button id="next">n</button></attribute-cycler>`,
      MODULES,
    );
    const events = await recordEvents(page, ["change"]);
    await page.locator("#next").click();
    expect(await page.evaluate(() => [document.getElementById("theme").value, localStorage.getItem("test-theme")])).toEqual(["light", "light"]);
    await events.take();
    await page.evaluate(() => document.getElementById("theme").reset());
    expect(await page.evaluate(() => [document.getElementById("theme").value, localStorage.getItem("test-theme")])).toEqual(["system", null]);
    expect(await events.take(), "script changes are silent").toEqual([]);
  });

  test('a data-cycle="reset" button resets and fires change', async ({ page }) => {
    await mount(
      page,
      `<attribute-cycler id="theme" target="html" values="light,dark" storage-key="test-theme"><button id="dark" value="dark">d</button><button id="reset" data-cycle="reset">r</button></attribute-cycler>`,
      MODULES,
    );
    await page.locator("#dark").click();
    const events = await recordEvents(page, ["change"]);
    await page.locator("#reset").click();
    expect(await events.take()).toEqual([["change", "theme"]]);
    expect(await page.evaluate(() => [document.getElementById("theme").value, localStorage.getItem("test-theme")])).toEqual(["light", null]);
    await page.locator("#reset").click();
    expect(await events.take(), "already at the default: no change").toEqual([]);
  });

  test("another tab's reset is followed", async ({ page, context }) => {
    await mount(page, THEME, MODULES);
    await page.locator("#dark").click();
    const other = await context.newPage();
    await other.goto("/test/browser/fixture.html");
    await other.evaluate(() => localStorage.removeItem("test-theme"));
    await expect.poll(() => state(page).then((s) => s.value)).toBe("light");
  });
});

test("invoker commands from buttons anywhere drive it, where supported", async ({ page }) => {
  await mount(
    page,
    `${THEME}<button id="remote" commandfor="theme" command="--next">Remote</button>
     <button id="remote-set" commandfor="theme" command="--set" value="system">System</button>`,
    MODULES,
  );
  const supported = await page.evaluate(() => "command" in HTMLButtonElement.prototype);
  test.skip(!supported, "this engine doesn't support invoker commands yet");
  await page.locator("#remote").click();
  expect((await state(page)).value).toBe("dark");
  await page.locator("#remote-set").click();
  expect((await state(page)).value).toBe("system");
});
