// The recipes in examples/ are real pages combining modules; each test
// drives one the way a user would. If a recipe breaks, a module stopped
// composing the way its docs say.
import { test, expect } from "@playwright/test";

const open = async (page, name) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/examples/${name}`);
  return errors;
};

test("theme switcher: value buttons set the theme, persist it, and reflect state", async ({ page }) => {
  const errors = await open(page, "theme-switcher.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Dark" }).click();
  expect(await page.evaluate(() => document.documentElement.className)).toBe("dark");
  await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("output")).toHaveText("dark");
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.className), "remembered").toBe("dark");
  expect(errors).toEqual([]);
});

test("command palette: the shortcut opens it, typing filters, Enter runs a command and closes", async ({ page }) => {
  const errors = await open(page, "command-palette.html");
  await page.locator("body").click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
  // (mod = Meta only on Apple *browsers*; Playwright's Chromium on Linux uses Control)
  if (!(await page.locator("#palette-dialog").evaluate((d) => d.open))) await page.keyboard.press("/");
  await expect(page.locator("#palette-dialog")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Command" })).toBeFocused();
  await page.keyboard.type("dark");
  await expect(page.getByRole("option", { name: "Switch to dark theme" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#palette-dialog")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.className)).toBe("dark");
  await expect(page.locator("#log")).toHaveText("Switch to dark theme");
  // Esc closes the list, then clears the text (like a search input), then
  // reaches the dialog and closes it.
  await page.keyboard.press("/");
  await page.keyboard.type("s");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.locator("#palette-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox")).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(page.locator("#palette-dialog")).toBeHidden();
  expect(errors).toEqual([]);
});

test("settings panel: one form across screens submits every control's value", async ({ page }) => {
  const errors = await open(page, "settings-panel.html");
  await page.getByRole("button", { name: "Language & region" }).click();
  await page.getByRole("option", { name: "Français" }).click();
  await page.getByRole("combobox").fill("tok");
  await page.getByRole("option", { name: "Asia/Tokyo" }).click();
  await page.getByRole("button", { name: "‹ Back" }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  const saved = JSON.parse(await page.locator("#result").textContent());
  expect(saved).toEqual({ name: "Ada", newsletter: "on", language: "fr", timezone: "Asia/Tokyo" });

  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  expect(JSON.parse(await page.locator("#result").textContent()), "reset restores every default").toEqual({
    name: "Ada",
    newsletter: "on",
    language: "en",
    timezone: "Europe/London",
  });

  // An empty required field in a hidden screen: submitting opens that screen.
  await page.getByRole("button", { name: "Profile" }).click();
  await page.locator("#name").fill("");
  await page.getByRole("button", { name: "‹ Back" }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#name")).toBeVisible();
  await expect(page.locator("#name")).toBeFocused();
  expect(errors).toEqual([]);
});

test("documentation page: tabs show highlighted code, hidden panels stay hidden", async ({ page }) => {
  const errors = await open(page, "documentation-page.html");
  const visibleCode = () =>
    page.evaluate(() => [...document.querySelectorAll("code-color")].filter((c) => c.checkVisibility()).length);
  expect(await visibleCode()).toBe(1);
  await page.getByRole("tab", { name: "npm" }).click();
  expect(await visibleCode()).toBe(1);
  await expect(page.getByRole("tabpanel")).toContainText("npm install");
  const highlighted = await page.evaluate(() => !("highlights" in CSS) || CSS.highlights.get("domkit-string").size > 0);
  expect(highlighted).toBe(true);
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(page.locator("query-container > ol.steps")).toHaveCount(1);
  await page.setViewportSize({ width: 500, height: 800 });
  await expect(page.locator("query-container > ul")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("game loop: the clock moves the ball; the button pauses and resumes", async ({ page }) => {
  const errors = await open(page, "game-loop.html");
  const position = () => page.locator("#ball").evaluate((b) => b.style.translate);
  const first = await position();
  await expect.poll(position).not.toBe(first);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "true");
  const paused = await page.locator("#ticks").textContent();
  await page.waitForTimeout(200);
  expect(await page.locator("#ticks").textContent()).toBe(paused);
  await page.getByRole("button", { name: "Play" }).click();
  await expect.poll(() => page.locator("#ticks").textContent()).not.toBe(paused);
  expect(errors).toEqual([]);
});
