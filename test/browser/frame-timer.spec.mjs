import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/frame-timer/global.mjs"];

test("ticks at roughly its fps on real animation frames, with no content", async ({ page }) => {
  await mount(page, `<frame-timer id="t" fps="20"></frame-timer>`, MODULES);
  const { ticks, frames } = await page.evaluate(async () => {
    const t = document.getElementById("t");
    const start = t.ticks;
    // Count the animation frames the browser actually delivers: a loaded
    // machine drops some, and the timer skips missed ticks by design.
    let frames = 0;
    let counting = true;
    const count = () => {
      frames++;
      if (counting) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    await new Promise((r) => setTimeout(r, 1000));
    counting = false;
    return { ticks: t.ticks - start, frames };
  });
  // With ~60 frames a second, it ticks ~20 times; with fewer, it can only
  // tick on the frames there are (one in every three, at 20 of 60).
  expect(ticks).toBeGreaterThanOrEqual(Math.min(16, Math.floor(frames / 3) - 2));
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

test("--play, --pause, and --toggle commands drive it, firing play/pause", async ({ page }) => {
  await mount(page, `<frame-timer id="clock" paused></frame-timer>`, MODULES);
  const result = await page.evaluate(() => {
    const clock = document.getElementById("clock");
    const seen = [];
    for (const type of ["play", "pause"]) clock.addEventListener(type, () => seen.push(type));
    const send = (command) => clock.dispatchEvent(Object.assign(new Event("command"), { command }));
    send("--play");
    const playing = !clock.paused;
    send("--toggle");
    const toggledOff = clock.paused;
    send("--toggle");
    send("--pause");
    return { seen, playing, toggledOff, paused: clock.paused };
  });
  expect(result).toEqual({ seen: ["play", "pause", "play", "pause"], playing: true, toggledOff: true, paused: true });
});
