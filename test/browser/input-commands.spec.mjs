import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/swipe-input/global.mjs", "src/gamepad-input/global.mjs"];
const TARGET = `<div id="t"></div>`;

const recordCommands = (page) =>
  page.evaluate(() => {
    window.commands = [];
    document.getElementById("t").addEventListener("command", (e) => window.commands.push([e.command, e.source.localName]));
  });

test.describe("swipe-input", () => {
  const AREA = `${TARGET}<swipe-input id="s" commandfor="t" up="--up" down="--down" left="--left" right="--right" style="width: 300px; height: 300px"></swipe-input>`;
  const swipe = async (page, dx, dy) => {
    await page.mouse.move(150, 150);
    await page.mouse.down();
    await page.mouse.move(150 + dx, 150 + dy, { steps: 4 });
    await page.mouse.up();
  };

  test("a swipe past the threshold sends that direction's command; a short drag doesn't", async ({ page }) => {
    await mount(page, AREA, MODULES);
    await recordCommands(page);
    await swipe(page, 100, 10);
    await swipe(page, -5, -80);
    await swipe(page, 10, 10); // too short
    expect(await page.evaluate(() => window.commands)).toEqual([["--right", "swipe-input"], ["--up", "swipe-input"]]);
  });

  test("a swipe that ends outside the area still counts", async ({ page }) => {
    await mount(page, `${TARGET}<swipe-input id="s" commandfor="t" down="--down" style="width: 100px; height: 100px"></swipe-input>`, MODULES);
    await recordCommands(page);
    await page.mouse.move(50, 50);
    await page.mouse.down();
    await page.mouse.move(50, 300, { steps: 5 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.commands)).toEqual([["--down", "swipe-input"]]);
  });

  test("swipe fires first and can be canceled; disabled and pointers filter", async ({ page }) => {
    await mount(page, AREA, MODULES);
    await recordCommands(page);
    await page.evaluate(() => {
      window.swipes = [];
      document.getElementById("s").addEventListener("swipe", (e) => {
        window.swipes.push(e.detail.direction);
        if (e.detail.direction === "down") e.preventDefault();
      });
    });
    await swipe(page, 0, 100);
    await page.evaluate(() => (document.getElementById("s").disabled = true));
    await swipe(page, 100, 0);
    await page.evaluate(() => {
      const s = document.getElementById("s");
      s.disabled = false;
      s.setAttribute("pointers", "touch"); // the mouse doesn't count now
    });
    await swipe(page, -100, 0);
    expect(await page.evaluate(() => [window.swipes, window.commands])).toEqual([["down"], []]);
  });

  test("is a block that doesn't scroll under a finger, without CSS", async ({ page }) => {
    await mount(page, `<swipe-input id="s"><p>area</p></swipe-input>`, MODULES);
    expect(await page.evaluate(() => {
      const style = getComputedStyle(document.getElementById("s"));
      return [style.display, style.touchAction];
    })).toEqual(["block", "none"]);
  });
});

test.describe("gamepad-input", () => {
  // A controllable fake controller.
  const FAKE = () => {
    window.pad = { index: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0] };
    window.padConnected = true;
    navigator.getGamepads = () => [window.padConnected ? window.pad : null];
  };
  const press = (page, i, down = true) => page.evaluate(([i, down]) => (window.pad.buttons[i].pressed = down), [i, down]);
  const frames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  test("a button going down sends its command once; holding doesn't repeat", async ({ page }) => {
    await page.addInitScript(FAKE);
    await mount(page, `${TARGET}<gamepad-input commandfor="t" a="--jump" up="--up" start="--toggle"></gamepad-input>`, MODULES);
    await recordCommands(page);
    await press(page, 0); // a
    await frames(page);
    await frames(page);
    await press(page, 0, false);
    await press(page, 12); // d-pad up
    await frames(page);
    await press(page, 12, false);
    await frames(page);
    await press(page, 0); // a again
    await frames(page);
    expect(await page.evaluate(() => window.commands.map(([c]) => c))).toEqual(["--jump", "--up", "--jump"]);
  });

  test("the left stick counts as the d-pad; gamepadpress can cancel; disabled ignores", async ({ page }) => {
    await page.addInitScript(FAKE);
    await mount(page, `${TARGET}<gamepad-input id="g" commandfor="t" left="--left" b="--back"></gamepad-input>`, MODULES);
    await recordCommands(page);
    await page.evaluate(() => {
      window.presses = [];
      document.getElementById("g").addEventListener("gamepadpress", (e) => {
        window.presses.push(e.detail.button);
        if (e.detail.button === "b") e.preventDefault();
      });
    });
    await page.evaluate(() => (window.pad.axes = [-0.9, 0]));
    await frames(page);
    await press(page, 1); // b, canceled
    await frames(page);
    await page.evaluate(() => {
      window.pad.axes = [0, 0];
      document.getElementById("g").disabled = true;
    });
    await frames(page);
    await page.evaluate(() => (window.pad.axes = [-0.9, 0]));
    await frames(page);
    expect(await page.evaluate(() => [window.presses, window.commands.map(([c]) => c)])).toEqual([["left", "b"], ["--left"]]);
  });

  test("index picks a controller; it stops polling when removed", async ({ page }) => {
    await page.addInitScript(FAKE);
    await mount(page, `${TARGET}<gamepad-input id="g" index="1" commandfor="t" a="--jump"></gamepad-input>`, MODULES);
    await recordCommands(page);
    await press(page, 0);
    await frames(page);
    expect(await page.evaluate(() => window.commands.length), "controller 0 isn't index 1").toBe(0);
    await page.evaluate(() => document.getElementById("g").setAttribute("index", "0"));
    await page.evaluate(() => {
      const g = document.getElementById("g");
      g.remove();
      document.body.append(g); // reconnect restarts polling
    });
    await press(page, 0, false);
    await frames(page);
    await press(page, 0);
    await frames(page);
    expect(await page.evaluate(() => window.commands.map(([c]) => c))).toEqual(["--jump"]);
  });
});
