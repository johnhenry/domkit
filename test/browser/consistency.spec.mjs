// Cross-module rules from docs/principles.md, checked for every stable
// element at once -- the things that should be true no matter which
// element you pick, and when you combine them.
import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

// module directory (under src/) -> sample markup for its element
const ELEMENTS = {
  "tabbed-ui": "<div><button>A</button></div><section>a</section>",
  "stylable-select": "<option>a</option>",
  "combo-box": "<option>a</option>",
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
const STYLES = ["tabbed-ui", "stylable-select", "combo-box", "drill-menu", "code-color"];

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
      <section><code-color><pre>let x</pre></code-color><stylable-select><option>a</option></stylable-select><combo-box></combo-box></section>
    </tabbed-ui>`;
    return [...document.querySelectorAll("code-color, stylable-select, combo-box")].filter((el) => el.checkVisibility()).length;
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
       <combo-box name="combo" value="c"><option>c</option></combo-box>
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
  expect(result.elements).toEqual(expect.arrayContaining(["stylable-select", "combo-box"]));
});
