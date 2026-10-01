import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/hotkey-dialog/global.mjs"];
const DIALOG = (attrs = 'hotkey="ctrl+k"', dialogAttrs = "") => `
  <input id="field" />
  <hotkey-dialog id="h" ${attrs}>
    <dialog id="d" ${dialogAttrs}><p>Hello</p><button id="inside">ok</button></dialog>
  </hotkey-dialog>`;
const isOpen = (page) => page.evaluate(() => document.getElementById("d").open);

test("its shortcut toggles a real, modal <dialog>", async ({ page }) => {
  await mount(page, DIALOG(), MODULES);
  await page.keyboard.press("Control+k");
  expect(await isOpen(page)).toBe(true);
  expect(await page.evaluate(() => document.getElementById("d").matches(":modal"))).toBe(true);
  await page.keyboard.press("Control+k");
  expect(await isOpen(page)).toBe(false);
});

test("modifiers must match exactly", async ({ page }) => {
  await mount(page, DIALOG(), MODULES);
  await page.keyboard.press("k");
  await page.keyboard.press("Control+Shift+k");
  await page.keyboard.press("Control+Alt+k");
  expect(await isOpen(page)).toBe(false);
});

test("mod means Meta on Apple platforms and Control elsewhere", async ({ page }) => {
  await mount(page, DIALOG('hotkey="mod+k"'), MODULES);
  const mac = await page.evaluate(() => /mac|iphone|ipad/i.test(navigator.platform));
  await page.keyboard.press(mac ? "Meta+k" : "Control+k");
  expect(await isOpen(page)).toBe(true);
});

test("several shortcuts; bare keys are ignored while typing in a field", async ({ page }) => {
  await mount(page, DIALOG('hotkey="ctrl+k /"'), MODULES);
  await page.locator("#field").focus();
  await page.keyboard.press("/");
  expect(await isOpen(page), "typing / in an input").toBe(false);
  await expect(page.locator("#field")).toHaveValue("/");
  await page.keyboard.press("Control+k");
  expect(await isOpen(page), "a modified shortcut still works in a field").toBe(true);
  await page.keyboard.press("Control+k");
  await page.locator("body").click();
  await page.keyboard.press("/");
  expect(await isOpen(page)).toBe(true);
});

test("Esc closes as usual; closedby=none blocks it", async ({ page }) => {
  await mount(page, DIALOG(), MODULES);
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  expect(await isOpen(page)).toBe(false);
  await mount(page, DIALOG('hotkey="ctrl+k"', 'closedby="none"'), MODULES);
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  expect(await isOpen(page)).toBe(true);
});

test("closedby=any closes on a backdrop click, not on a click inside", async ({ page }) => {
  await mount(page, DIALOG('hotkey="ctrl+k"', 'closedby="any"'), MODULES);
  await page.keyboard.press("Control+k");
  await page.locator("#inside").click();
  expect(await isOpen(page)).toBe(true);
  await page.mouse.click(5, 5);
  expect(await isOpen(page)).toBe(false);
});

test("non-modal opens with show(); methods and focus return work", async ({ page }) => {
  await mount(page, DIALOG('hotkey="ctrl+k" non-modal'), MODULES);
  await page.keyboard.press("Control+k");
  expect(await page.evaluate(() => [document.getElementById("d").open, document.getElementById("d").matches(":modal")])).toEqual([true, false]);
  await page.evaluate(() => document.getElementById("h").close("bye"));
  expect(await page.evaluate(() => document.getElementById("d").returnValue)).toBe("bye");
  await page.evaluate(() => document.getElementById("h").toggle());
  expect(await isOpen(page)).toBe(true);
});

test("hotkey changes apply, and disconnecting removes the listener", async ({ page }) => {
  await mount(page, DIALOG(), MODULES);
  await page.evaluate(() => (document.getElementById("h").hotkey = "alt+j"));
  await page.keyboard.press("Control+k");
  expect(await isOpen(page)).toBe(false);
  await page.keyboard.press("Alt+j");
  expect(await isOpen(page)).toBe(true);
  await page.keyboard.press("Alt+j");
  await page.evaluate(() => {
    const h = document.getElementById("h");
    window.toggled = 0;
    h.toggle = () => window.toggled++;
    h.remove();
  });
  await page.keyboard.press("Alt+j");
  expect(await page.evaluate(() => window.toggled)).toBe(0);
});
