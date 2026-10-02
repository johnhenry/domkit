import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/hot-key/global.mjs"];
const DIALOG = (attrs = 'hotkey="ctrl+k"', dialogAttrs = "") => `
  <input id="field" />
  <hot-key id="h" ${attrs}>
    <dialog id="d" ${dialogAttrs}><p>Hello</p><button id="inside">ok</button></dialog>
  </hot-key>`;
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

test.describe("popovers", () => {
  const POPOVER = `
    <hot-key id="h" hotkey="ctrl+j">
      <div id="p" popover><button id="in">inside</button></div>
    </hot-key>`;
  const popoverOpen = (page) => page.evaluate(() => document.getElementById("p").matches(":popover-open"));

  test("the shortcut toggles a popover child; Esc and light dismiss stay native", async ({ page }) => {
    await mount(page, POPOVER, MODULES);
    await page.keyboard.press("Control+j");
    expect(await popoverOpen(page)).toBe(true);
    expect(await page.evaluate(() => document.getElementById("h").open)).toBe(true);
    await page.keyboard.press("Control+j");
    expect(await popoverOpen(page)).toBe(false);
    await page.keyboard.press("Control+j");
    await page.keyboard.press("Escape");
    expect(await popoverOpen(page), "Esc").toBe(false);
  });

  test("show(), close(), toggle(), and target work for popovers", async ({ page }) => {
    await mount(page, POPOVER, MODULES);
    const states = await page.evaluate(() => {
      const h = document.getElementById("h");
      const seen = [h.target.id, h.dialog];
      h.show();
      seen.push(h.open);
      h.toggle();
      seen.push(h.open);
      h.toggle();
      h.close();
      seen.push(h.open);
      return seen;
    });
    expect(states).toEqual(["p", null, true, false, false]);
  });
});

test.describe("invoker commands", () => {
  test("commandfor + a custom --command dispatches a command event, like a button", async ({ page }) => {
    await mount(
      page,
      `<div id="target"></div>
       <hot-key id="h" hotkey="ctrl+j" commandfor="target" command="--next"></hot-key>`,
      MODULES,
    );
    await page.evaluate(() => {
      window.got = [];
      document.getElementById("target").addEventListener("command", (e) => window.got.push([e.command, e.source.id]));
    });
    await page.keyboard.press("Control+j");
    expect(await page.evaluate(() => window.got)).toEqual([["--next", "h"]]);
  });

  test("built-in commands open dialogs and popovers elsewhere on the page", async ({ page }) => {
    await mount(
      page,
      `<dialog id="d"><p>dialog</p></dialog><div id="p" popover>popover</div>
       <hot-key hotkey="ctrl+j" commandfor="d" command="show-modal"></hot-key>
       <hot-key hotkey="ctrl+l" commandfor="p" command="toggle-popover"></hot-key>`,
      MODULES,
    );
    await page.keyboard.press("Control+l");
    expect(await page.evaluate(() => document.getElementById("p").matches(":popover-open"))).toBe(true);
    await page.keyboard.press("Control+l");
    expect(await page.evaluate(() => document.getElementById("p").matches(":popover-open"))).toBe(false);
    await page.keyboard.press("Control+j");
    expect(await page.evaluate(() => document.getElementById("d").matches(":modal"))).toBe(true);
  });

  test("drives other domkit elements: attribute-cycler's --next", async ({ page }) => {
    await mount(
      page,
      `<attribute-cycler id="theme" values="light,dark"><button value="light">L</button><button value="dark">D</button></attribute-cycler>
       <hot-key hotkey="ctrl+j" commandfor="theme" command="--next"></hot-key>`,
      [...MODULES, "src/cyclable/attribute-cycler/global.mjs"],
    );
    expect(await page.evaluate(() => document.getElementById("theme").value)).toBe("light");
    await page.keyboard.press("Control+j");
    expect(await page.evaluate(() => document.getElementById("theme").value)).toBe("dark");
  });

  test("an unknown command or missing element doesn't swallow the key", async ({ page }) => {
    await mount(
      page,
      `<hot-key hotkey="ctrl+j" commandfor="nope" command="--next"></hot-key>`,
      MODULES,
    );
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent("keydown", { key: "j", ctrlKey: true, cancelable: true, bubbles: true });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(false);
  });
});
