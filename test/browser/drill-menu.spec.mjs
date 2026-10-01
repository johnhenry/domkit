import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/drill-menu/global.mjs"];
const MENU = (attrs = "") => `
  <drill-menu id="m" ${attrs}>
    <button data-key="profile">Profile
      <template><h2>Profile</h2><input id="name" /><button data-back id="back">Back</button></template>
    </button>
    <button data-key="settings">Settings
      <template><h2>Settings</h2><p>Nothing focusable here.</p></template>
    </button>
    <a href="#leaf" id="leaf">Help (a leaf)</a>
  </drill-menu>`;

const state = (page) =>
  page.evaluate(() => {
    const m = document.getElementById("m");
    return {
      screen: m.screen,
      attr: m.getAttribute("screen"),
      itemsHidden: m.items.map((i) => i.hidden),
      screenText: m.querySelector("[data-drill-screen]").textContent.trim().slice(0, 20),
      expanded: m.items.map((i) => i.getAttribute("aria-expanded")),
    };
  });

test("clicking an item drills into its screen; Back returns and restores focus", async ({ page }) => {
  await mount(page, MENU(), MODULES);
  await page.getByRole("button", { name: "Profile" }).click();
  expect(await state(page)).toMatchObject({ screen: "profile", itemsHidden: [true, true, true], expanded: ["true", "false", null] });
  await expect(page.getByRole("region", { name: "Profile" })).toBeVisible();
  await expect(page.locator("#name"), "focus moves to the screen's first focusable").toBeFocused();
  await page.locator("#back").click();
  expect(await state(page)).toMatchObject({ screen: null, attr: null, itemsHidden: [false, false, false] });
  await expect(page.getByRole("button", { name: "Profile" })).toBeFocused();
});

test("Esc goes back; a screen with nothing focusable gets focus itself", async ({ page }) => {
  await mount(page, MENU(), MODULES);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("[data-drill-screen]")).toBeFocused();
  await page.keyboard.press("Escape");
  expect((await state(page)).screen).toBe(null);
  await expect(page.getByRole("button", { name: "Settings" })).toBeFocused();
});

test("one tab stop; arrows, Home, End move between items", async ({ page }) => {
  await mount(page, `<button id="before">before</button>${MENU()}`, MODULES);
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Profile" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Settings" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator("#leaf")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Profile" }), "wraps").toBeFocused();
  await page.keyboard.press("Enter");
  expect((await state(page)).screen).toBe("profile");
});

test("leaf items behave as themselves", async ({ page }) => {
  await mount(page, MENU(), MODULES);
  await page.locator("#leaf").click();
  expect(await page.evaluate(() => location.hash)).toBe("#leaf");
  expect((await state(page)).screen).toBe(null);
});

test("the screen attribute/property navigates, and push/pop events fire", async ({ page }) => {
  await mount(page, MENU(), MODULES);
  await page.evaluate(() => {
    window.log = [];
    const m = document.getElementById("m");
    m.addEventListener("push", (e) => window.log.push(`push ${e.detail.key}`));
    m.addEventListener("pop", (e) => window.log.push(`pop ${e.detail.key}`));
    m.screen = "settings";
    m.setAttribute("screen", "profile");
    m.screen = null;
  });
  expect(await page.evaluate(() => window.log)).toEqual(["push settings", "pop settings", "push profile", "pop profile"]);
  expect(await page.evaluate(() => document.getElementById("m").push("help"))).toBe(false);
});

test("initial screen from the attribute; items can be keyed by position", async ({ page }) => {
  await mount(page, MENU('screen="1"'), MODULES);
  expect(await state(page), "reflects the item's data-key").toMatchObject({ screen: "settings", screenText: "SettingsNothing focu" });
});

test("sync-hash: pushing sets the hash, the browser's Back pops, and the hash opens screens", async ({ page }) => {
  await mount(page, MENU("sync-hash"), MODULES);
  await page.getByRole("button", { name: "Profile" }).click();
  expect(await page.evaluate(() => location.hash)).toBe("#profile");
  await page.goBack();
  await expect.poll(() => state(page).then((s) => s.screen)).toBe(null);
  await page.evaluate(() => (location.hash = "settings"));
  await expect.poll(() => state(page).then((s) => s.screen)).toBe("settings");
  await page.locator("[data-drill-screen]").focus();
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
});

test("an author-hidden item stays hidden after Back", async ({ page }) => {
  await mount(page, MENU().replace('<a href="#leaf" id="leaf">', '<a href="#leaf" id="leaf" hidden>'), MODULES);
  await page.getByRole("button", { name: "Profile" }).click();
  await page.locator("#back").click();
  expect((await state(page)).itemsHidden).toEqual([false, false, true]);
});

test("nested menus are independent", async ({ page }) => {
  await mount(
    page,
    `<drill-menu id="m">
       <button data-key="outer">Outer
         <template><drill-menu id="inner"><button data-key="deep">Deep<template><p id="deep">deep</p><button data-back>Up</button></template></button></drill-menu></template>
       </button>
     </drill-menu>`,
    MODULES,
  );
  await page.getByRole("button", { name: "Outer" }).click();
  await page.getByRole("button", { name: "Deep" }).click();
  await expect(page.locator("#deep")).toBeVisible();
  await page.getByRole("button", { name: "Up" }).click();
  expect(await page.evaluate(() => [document.getElementById("m").screen, document.getElementById("inner").screen])).toEqual(["outer", null]);
});

test("invoker commands --push and --back, where supported", async ({ page }) => {
  await mount(page, `${MENU()}<button id="go" commandfor="m" command="--push" value="settings">Go</button><button id="up" commandfor="m" command="--back">Up</button>`, MODULES);
  test.skip(!(await page.evaluate(() => "command" in HTMLButtonElement.prototype)), "no invoker commands");
  await page.locator("#go").click();
  expect((await state(page)).screen).toBe("settings");
  await page.locator("#up").click();
  expect((await state(page)).screen).toBe(null);
});
