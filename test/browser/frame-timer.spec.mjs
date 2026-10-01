import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/frame-timer/global.mjs"];

test("ticks at roughly its fps on real animation frames, with no content", async ({ page }) => {
  await mount(page, `<frame-timer id="t" fps="20"></frame-timer>`, MODULES);
  const ticks = await page.evaluate(async () => {
    const t = document.getElementById("t");
    const start = t.ticks;
    await new Promise((r) => setTimeout(r, 1000));
    return t.ticks - start;
  });
  expect(ticks).toBeGreaterThanOrEqual(16);
  expect(ticks).toBeLessThanOrEqual(22);
});

test("starts paused from markup without firing pause; play()/pause() fire events", async ({ page }) => {
  await mount(page, `<frame-timer id="t" fps="30" paused></frame-timer>`, MODULES);
  const result = await page.evaluate(async () => {
    const t = document.getElementById("t");
    const events = [];
    for (const type of ["play", "pause"]) t.addEventListener(type, () => events.push(type));
    await new Promise((r) => setTimeout(r, 200));
    const whilePaused = t.ticks;
    t.play();
    await new Promise((r) => setTimeout(r, 300));
    const afterPlay = t.ticks;
    t.pause();
    t.pause(); // no second event
    return { whilePaused, afterPlay, events, paused: t.paused, attr: t.hasAttribute("paused") };
  });
  expect(result.whilePaused).toBe(0);
  expect(result.afterPlay).toBeGreaterThan(3);
  expect(result).toMatchObject({ events: ["play", "pause"], paused: true, attr: true });
});

test("a move doesn't double the rate", async ({ page }) => {
  await mount(page, `<frame-timer id="t" fps="20"></frame-timer>`, MODULES);
  const ticks = await page.evaluate(async () => {
    const t = document.getElementById("t");
    document.body.append(t);
    const start = t.ticks;
    await new Promise((r) => setTimeout(r, 1000));
    return t.ticks - start;
  });
  expect(ticks).toBeLessThanOrEqual(22);
});
