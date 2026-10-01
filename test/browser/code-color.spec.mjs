import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/code-color/global.mjs"];

const tokens = (page, id) =>
  page.evaluate((id) => document.getElementById(id).tokens().map(({ type, text }) => `${type}:${text}`), id);

test.beforeEach(async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  const supported = await page.evaluate(() => "highlights" in CSS);
  test.skip(!supported, "no CSS Custom Highlight API in this engine");
});

test("highlights JavaScript without changing the DOM", async ({ page }) => {
  const source = `<pre><code>const n = 42; // answer\nfetch("/x");</code></pre>`;
  await mount(page, `<code-color id="c" language="js">${source}</code-color>`, MODULES);
  expect(await page.evaluate(() => document.getElementById("c").innerHTML)).toBe(source);
  expect(await tokens(page, "c")).toEqual([
    "keyword:const",
    "number:42",
    "comment:// answer",
    "function:fetch",
    'string:"/x"',
  ]);
  const registered = await page.evaluate(() => CSS.highlights.get("domkit-keyword").size);
  expect(registered).toBeGreaterThan(0);
});

test("takes the language from a language-* class, like Markdown/Prism output", async ({ page }) => {
  await mount(page, `<code-color id="c"><pre><code class="language-css">a { color: #fff }</code></pre></code-color>`, MODULES);
  expect(await tokens(page, "c")).toEqual(["tag:a", "property:color", "number:#fff"]);
});

test("HTML (escaped in markup) with embedded CSS and JS", async ({ page }) => {
  await mount(
    page,
    `<code-color id="c"><pre>&lt;p class="x"&gt;hi&lt;/p&gt;&lt;script&gt;let y = 1;&lt;/script&gt;</pre></code-color>`,
    MODULES,
  );
  expect(await tokens(page, "c")).toEqual([
    "tag:<p",
    "attribute:class",
    'string:"x"',
    "tag:>",
    "tag:</p",
    "tag:>",
    "tag:<script",
    "tag:>",
    "keyword:let",
    "number:1",
    "tag:</script",
    "tag:>",
  ]);
});

test("ranges span text split across nodes", async ({ page }) => {
  await mount(page, `<code-color id="c" language="js"><pre>con<b>st</b> x</pre></code-color>`, MODULES);
  expect(await tokens(page, "c")).toEqual(["keyword:const"]);
});

test("re-highlights when the text changes, including while editing", async ({ page }) => {
  await mount(page, `<code-color id="c" language="js"><pre contenteditable id="e">let a</pre></code-color>`, MODULES);
  await page.locator("#e").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" = true");
  await expect.poll(() => tokens(page, "c")).toEqual(["keyword:let", "keyword:true"]);
  await page.evaluate(() => (document.getElementById("c").language = "css"));
  await expect.poll(() => tokens(page, "c")).not.toContain("keyword:let");
});

test("removing an element removes its ranges from the shared highlights", async ({ page }) => {
  await mount(
    page,
    `<code-color id="a" language="js"><pre>const a</pre></code-color><code-color id="b" language="js"><pre>let b</pre></code-color>`,
    MODULES,
  );
  const sizes = await page.evaluate(() => {
    const before = CSS.highlights.get("domkit-keyword").size;
    document.getElementById("a").remove();
    return [before, CSS.highlights.get("domkit-keyword").size];
  });
  expect(sizes).toEqual([2, 1]);
});
