// Cross-module rules from docs/principles.md, checked for every stable
// element at once -- the things that should be true no matter which
// element you pick, and when you combine them.
import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

// module directory (under src/) -> sample markup for its element
const ELEMENTS = {
  "tabbed-ui": "<div><button>A</button></div><section>a</section>",
  "stylable-select": "<option>a</option>",
  "infinite-combo-box": "<option>a</option>",
  "hotkey-dialog": "<dialog>d</dialog>",
  "drill-menu": "<button>a<template>x</template></button>",
  "code-color": "<pre>let a</pre>",
  "frame-timer": "",
  "cyclable/class-cycler": "<button>a</button>",
  "matchable/query-container": "<li>a</li>",
  "matchable/attribute-provider": "<p>a</p>",
};
const tagOf = (path) => path.split("/").pop();
const MODULES = Object.keys(ELEMENTS).map((path) => `src/${path}/global.mjs`);
const STYLES = ["tabbed-ui", "stylable-select", "infinite-combo-box", "drill-menu", "code-color"];

const loadStyles = (page) =>
  page.evaluate((styles) => {
    for (const name of styles) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/src/${name}/index.css`;
      document.head.append(link);
    }
    return Promise.all([...document.querySelectorAll("link")].map((l) => l.sheet ? null : new Promise((r) => (l.onload = r))));
  }, STYLES);

test("every stable element registers the tag named after its module", async ({ page }) => {
  await mount(page, "", MODULES);
  const missing = await page.evaluate((tags) => tags.filter((tag) => !customElements.get(tag)), Object.keys(ELEMENTS).map(tagOf));
  expect(missing).toEqual([]);
});

test("the hidden attribute hides every element, even with its stylesheet loaded", async ({ page }) => {
  await mount(page, "", MODULES);
  await loadStyles(page);
  const visible = await page.evaluate((elements) => {
    document.body.innerHTML = Object.entries(elements)
      .map(([path, inner]) => {
        const tag = path.split("/").pop();
        return `<${tag} hidden data-path="${path}" classes="x" query="" default="div">${inner}</${tag}>`;
      })
      .join("");
    return [...document.body.children].filter((el) => el.checkVisibility()).map((el) => el.localName);
  }, ELEMENTS);
  expect(visible).toEqual([]);
});

test("elements nested in a hidden tabbed-ui panel stay hidden", async ({ page }) => {
  await mount(page, "", MODULES);
  await loadStyles(page);
  const visible = await page.evaluate(() => {
    document.body.innerHTML = `<tabbed-ui><div><button>1</button><button>2</button></div>
      <section>first</section>
      <section><code-color><pre>let x</pre></code-color><stylable-select><option>a</option></stylable-select><infinite-combo-box></infinite-combo-box></section>
    </tabbed-ui>`;
    return [...document.querySelectorAll("code-color, stylable-select, infinite-combo-box")].filter((el) => el.checkVisibility()).length;
  });
  expect(visible).toBe(0);
});

test("every element works however it's created, and survives a move, without errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await mount(page, "", MODULES);
  await page.evaluate(async (elements) => {
    const tick = () => new Promise((r) => setTimeout(r, 10));
    for (const [path, inner] of Object.entries(elements)) {
      const tag = path.split("/").pop();
      // 1. parsed from markup (innerHTML upgrade)
      document.body.innerHTML = `<div id="a"><${tag}>${inner}</${tag}></div><div id="b"></div>`;
      await tick();
      // 2. moved (disconnect + reconnect in one task)
      const el = document.querySelector(tag);
      document.getElementById("b").append(el);
      await tick();
      // 3. built with createElement, children before connect
      const built = document.createElement(tag);
      built.innerHTML = inner;
      document.body.append(built);
      await tick();
      // 4. removed
      built.remove();
      el.remove();
      await tick();
    }
  }, ELEMENTS);
  expect(errors).toEqual([]);
});

test("form-associated elements behave alike in one form", async ({ page }) => {
  await mount(
    page,
    `<form id="f">
       <input name="native" value="n" />
       <select name="select"><option>s</option></select>
       <stylable-select name="stylable"><option selected>a</option></stylable-select>
       <infinite-combo-box name="combo" value="c"><option>c</option></infinite-combo-box>
     </form>`,
    MODULES,
  );
  const result = await page.evaluate(() => {
    const form = document.getElementById("f");
    const fieldset = document.createElement("fieldset");
    fieldset.append(...form.children);
    form.append(fieldset);
    const before = [...new FormData(form)].map(([k]) => k);
    fieldset.disabled = true;
    const disabled = [...new FormData(form)].map(([k]) => k);
    const matches = [...fieldset.children].map((el) => el.matches(":disabled"));
    fieldset.disabled = false;
    return { before, disabled, matches, elements: [...form.elements].map((el) => el.localName) };
  });
  expect(result.before).toEqual(["native", "select", "stylable", "combo"]);
  expect(result.disabled, "a disabled fieldset disables all of them").toEqual([]);
  expect(result.matches).toEqual([true, true, true, true]);
  expect(result.elements).toEqual(expect.arrayContaining(["stylable-select", "infinite-combo-box"]));
});

test("disabled means the same thing everywhere: no interaction, out of the tab order, no events", async ({ page }) => {
  await mount(
    page,
    `<button id="before">before</button>
     <tabbed-ui id="t" disabled><div><button>A</button><button>B</button></div><p>a</p><p>b</p></tabbed-ui>
     <drill-menu id="m" disabled><button data-key="x">X<template>x</template></button></drill-menu>
     <class-cycler id="c" disabled classes="p,q"><button id="cb">cycle</button></class-cycler>
     <hotkey-dialog id="h" disabled hotkey="ctrl+k"><dialog id="d">d</dialog></hotkey-dialog>
     <stylable-select id="s" disabled><option>a</option><option>b</option></stylable-select>
     <infinite-combo-box id="i" disabled><option>a</option></infinite-combo-box>
     <input id="after" aria-label="after" />`,
    MODULES,
  );
  // (#after is an input: WebKit, like Safari by default, leaves buttons out
  // of the Tab order.)
  const events = [];
  await page.exposeFunction("record", (e) => events.push(e));
  await page.evaluate(() => {
    for (const type of ["change", "input", "push"]) document.addEventListener(type, (e) => window.record(`${type}:${e.target.id}`));
  });
  // Tab order: no disabled control is a stop. (The visible tab panel still
  // is, so its content stays reachable and scrollable.)
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#t [role=tabpanel]:not([hidden])")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
  // Clicks do nothing.
  await page.getByRole("tab", { name: "B" }).click({ force: true });
  await page.getByRole("button", { name: "X" }).click({ force: true });
  await page.locator("#cb").click({ force: true });
  await page.keyboard.press("Control+k");
  expect(await page.evaluate(() => ({
    tab: document.getElementById("t").selectedIndex,
    screen: document.getElementById("m").screen,
    cycler: document.getElementById("c").value,
    dialog: document.getElementById("d").open,
    tablistDisabled: document.querySelector("#t [role=tablist]").getAttribute("aria-disabled"),
    itemDisabled: document.querySelector("#m button").getAttribute("aria-disabled"),
  }))).toEqual({ tab: 0, screen: null, cycler: "p", dialog: false, tablistDisabled: "true", itemDisabled: "true" });
  expect(events).toEqual([]);
  // ...and re-enabling restores everything.
  await page.evaluate(() => {
    for (const id of ["t", "m", "c", "h"]) document.getElementById(id).disabled = false;
  });
  await page.getByRole("tab", { name: "B" }).click();
  await page.locator("#cb").click();
  await page.keyboard.press("Control+k");
  expect(await page.evaluate(() => [document.getElementById("t").selectedIndex, document.getElementById("c").value, document.getElementById("d").open, document.querySelector("#m button").hasAttribute("aria-disabled")])).toEqual([1, "q", true, false]);
});

test("stylable-select and infinite-combo-box expose the same option API", async ({ page }) => {
  await mount(
    page,
    `<stylable-select id="s"><option value="a">A</option><option value="b">B</option></stylable-select>
     <infinite-combo-box id="i"><option value="a">A</option><option value="b">B</option></infinite-combo-box>`,
    MODULES,
  );
  const result = await page.evaluate(async () => {
    const s = document.getElementById("s");
    const i = document.getElementById("i");
    i.input.value = ""; // show every option
    i.input.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 20));
    const shape = (el) => {
      el.selectedIndex = 1;
      return {
        value: el.value,
        selectedIndex: el.selectedIndex,
        selectedOption: el.selectedOption?.textContent,
        selectedOptions: el.selectedOptions.map((o) => o.textContent),
        length: el.length,
        item0: el.item(0)?.textContent,
        options: el.options.map((o) => o.textContent),
      };
    };
    return [shape(s), shape(i)];
  });
  expect(result[1]).toEqual(result[0]);
  expect(result[0]).toEqual({ value: "b", selectedIndex: 1, selectedOption: "B", selectedOptions: ["B"], length: 2, item0: "A", options: ["A", "B"] });
});

test("right-to-left: horizontal arrow keys follow the reading direction", async ({ page }) => {
  await mount(
    page,
    `<div dir="rtl">
       <tabbed-ui id="t"><div><button>א</button><button>ב</button><button>ג</button></div><p>1</p><p>2</p><p>3</p></tabbed-ui>
       <drill-menu id="m"><button id="m1">אחד</button><button id="m2">שתיים</button></drill-menu>
     </div>`,
    MODULES,
  );
  await page.getByRole("tab", { name: "א" }).focus();
  await page.keyboard.press("ArrowLeft"); // visually "forward" in RTL
  expect(await page.evaluate(() => document.getElementById("t").selectedIndex)).toBe(1);
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => document.getElementById("t").selectedIndex)).toBe(0);
  await page.locator("#m1").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#m2")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#m1")).toBeFocused();
});
