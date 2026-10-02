import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = [
  "src/definable/define-component/global.mjs",
  "src/definable/polyfill-window/global.mjs",
];

// Run `html` in the fixture and collect load/error events from every
// <define-*>/<polyfill-window> element, in order.
const run = (page, html) =>
  page.evaluate(
    async ({ html }) => {
      const events = [];
      for (const type of ["load", "error"]) {
        document.addEventListener(
          type,
          (e) => {
            if (e.target instanceof Element) events.push([type, e.target.id, e.message ?? null]);
          },
          true,
        );
      }
      document.body.insertAdjacentHTML("beforeend", html);
      await Promise.allSettled(
        [...document.querySelectorAll("define-component, polyfill-window")].map((el) => el.ready),
      );
      await new Promise((r) => setTimeout(r, 50));
      return events;
    },
    { html },
  );

test.describe("define-component", () => {
  test("registers a module's default or named export, then fires load", async ({ page }) => {
    await mount(page, "", MODULES);
    const events = await run(
      page,
      `<define-component id="a" name="x-default" src="modules/widget.mjs"></define-component>
       <define-component id="b" name="x-named" src="modules/widget.mjs" import="Named"></define-component>
       <x-default></x-default><x-named></x-named>`,
    );
    expect(events.sort(), "both load (in either order)").toEqual([["load", "a", null], ["load", "b", null]]);
    await expect(page.locator("x-default")).toHaveText("default export");
    await expect(page.locator("x-named")).toHaveText("named export");
  });

  test("src resolves against the document's base URL, like <script src>", async ({ page }) => {
    await mount(page, "", MODULES);
    const events = await page.evaluate(async () => {
      const base = document.createElement("base");
      base.href = "/test/browser/modules/";
      document.head.prepend(base);
      document.body.insertAdjacentHTML("beforeend", '<define-component id="c" name="x-based" src="widget.mjs"></define-component>');
      await document.getElementById("c").ready;
      return customElements.get("x-based") !== undefined;
    });
    expect(events).toBe(true);
  });

  test("an already-registered name is a success, not an error", async ({ page }) => {
    await mount(page, "", MODULES);
    const events = await run(
      page,
      `<define-component id="a" name="x-twice" src="modules/widget.mjs"></define-component>
       <define-component id="b" name="x-twice" src="modules/widget.mjs" import="Named"></define-component>`,
    );
    expect(events.map(([type, id]) => [type, id]).sort()).toEqual([["load", "a"], ["load", "b"]]);
  });

  test("failures fire error with a reason, instead of an unhandled rejection", async ({ page }) => {
    await mount(page, "", MODULES);
    const unhandled = [];
    page.on("pageerror", (e) => unhandled.push(e.message));
    const events = await run(
      page,
      `<define-component id="missing" name="x-missing" src="modules/nope.mjs"></define-component>
       <define-component id="noexport" name="x-noexport" src="modules/widget.mjs" import="Nope"></define-component>
       <define-component id="notclass" name="x-notclass" src="modules/widget.mjs" import="notAClass"></define-component>`,
    );
    expect(events.map(([type, id]) => [type, id]).sort()).toEqual([
      ["error", "missing"],
      ["error", "noexport"],
      ["error", "notclass"],
    ]);
    expect(events.find(([, id]) => id === "noexport")[2]).toContain('no export named "Nope"');
    expect(unhandled).toEqual([]);
  });
});

test.describe("define-component, inline markup", () => {
  test("defines an element from a <template>, in a shadow root with working slots and scoped styles", async ({ page }) => {
    await mount(
      page,
      `<define-component id="d" name="x-callout">
         <template><style>:host { display: block; color: rgb(0, 128, 128); }</style><b>Note:</b> <slot></slot></template>
       </define-component>
       <x-callout id="one">first</x-callout><x-callout id="two">second</x-callout><p id="outside">outside</p>`,
      MODULES,
    );
    const result = await page.evaluate(() => ({
      shadow: document.getElementById("one").shadowRoot.innerHTML.includes("<slot>"),
      color: getComputedStyle(document.getElementById("one")).color,
      outsideColor: getComputedStyle(document.getElementById("outside")).color,
      text: document.getElementById("two").shadowRoot.textContent.includes("Note:"),
    }));
    expect(result).toEqual({ shadow: true, color: "rgb(0, 128, 128)", outsideColor: "rgb(0, 0, 0)", text: true });
    await expect(page.locator("#two")).toContainText("second");
  });

  test("mode=none appends light DOM; the content attribute works too", async ({ page }) => {
    await mount(
      page,
      `<define-component name="x-light" mode="none"><template><em>light</em></template></define-component>
       <define-component name="x-attr" content="<i>from attribute</i>"></define-component>
       <x-light></x-light><x-attr></x-attr>`,
      MODULES,
    );
    expect(await page.evaluate(() => [document.querySelector("x-light").innerHTML, !!document.querySelector("x-light").shadowRoot])).toEqual(["<em>light</em>", false]);
    expect(await page.evaluate(() => document.querySelector("x-attr").shadowRoot.innerHTML)).toBe("<i>from attribute</i>");
  });

  test("an invalid name fires error", async ({ page }) => {
    await mount(page, "", MODULES);
    const events = await page.evaluate(async () => {
      const seen = [];
      document.addEventListener("error", (e) => seen.push(e.target.id), true);
      document.body.insertAdjacentHTML("beforeend", '<define-component id="bad" name="nohyphen"></define-component>');
      await new Promise((r) => setTimeout(r, 20));
      return seen;
    });
    expect(events).toEqual(["bad"]);
  });
});

test.describe("define-component, one source", () => {
  test("src and inline markup together, or neither, fire error and register nothing", async ({ page }) => {
    await mount(page, "", MODULES);
    const unhandled = [];
    page.on("pageerror", (e) => unhandled.push(e.message));
    const events = await run(
      page,
      `<define-component id="both" name="x-both" src="modules/widget.mjs"><template><b>inline</b></template></define-component>
       <define-component id="both-attr" name="x-both-attr" src="modules/widget.mjs" content="<b>inline</b>"></define-component>
       <define-component id="neither" name="x-neither"></define-component>`,
    );
    expect(events.map(([type, id]) => [type, id]).sort()).toEqual([
      ["error", "both"],
      ["error", "both-attr"],
      ["error", "neither"],
    ]);
    expect(events.find(([, id]) => id === "both")[2]).toContain("not both");
    expect(events.find(([, id]) => id === "neither")[2]).toContain("needs src");
    expect(await page.evaluate(() => ["x-both", "x-both-attr", "x-neither"].map((n) => customElements.get(n) ?? null))).toEqual([null, null, null]);
    expect(unhandled).toEqual([]);
  });

  test("ready resolves with the class for inline markup too", async ({ page }) => {
    await mount(page, "", MODULES);
    const ok = await page.evaluate(async () => {
      document.body.insertAdjacentHTML("beforeend", '<define-component id="r" name="x-ready" content="<i>hi</i>"></define-component>');
      return (await document.getElementById("r").ready) === customElements.get("x-ready");
    });
    expect(ok).toBe(true);
  });
});

test.describe("polyfill-window", () => {
  test("assigns an export to window, unless the global already exists", async ({ page }) => {
    await mount(page, "", MODULES);
    await page.evaluate(() => (window.existing = "mine"));
    const events = await run(
      page,
      `<polyfill-window id="p" name="WidgetClass" src="modules/widget.mjs" import="Named"></polyfill-window>
       <polyfill-window id="q" name="existing" src="modules/widget.mjs"></polyfill-window>`,
    );
    expect(events.map(([type, id]) => [type, id]).sort()).toEqual([["load", "p"], ["load", "q"]]);
    expect(await page.evaluate(() => [typeof window.WidgetClass, window.existing])).toEqual(["function", "mine"]);
  });

  test("failures fire error", async ({ page }) => {
    await mount(page, "", MODULES);
    const events = await run(page, `<polyfill-window id="p" name="nope" src="modules/nope.mjs"></polyfill-window>`);
    expect(events.map(([type, id]) => [type, id])).toEqual([["error", "p"]]);
  });
});

test("until-window-load removes its class once the page has loaded", async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  const cls = await page.evaluate(async () => {
    document.body.innerHTML = '<p class="until-window-load keep">x</p>';
    await import("/src/definable/until-window-load/global.mjs");
    return document.querySelector("p").className;
  });
  expect(cls).toBe("keep");
});
