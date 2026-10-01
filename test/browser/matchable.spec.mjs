import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/matchable/query-container/global.mjs", "src/matchable/attribute-provider/global.mjs"];
const WIDE = { width: 1000, height: 700 };
const NARROW = { width: 500, height: 700 };

test.describe("query-container", () => {
  const LIST = `<query-container id="q" default="ul.plain" query="[(min-width: 600px)] ol.steps[data-kind=numbered]"><li>a</li><li>b</li></query-container>`;
  const wrapper = (page) =>
    page.evaluate(() => {
      const el = document.getElementById("q").firstElementChild;
      return { tag: el.localName, className: el.className, kind: el.dataset.kind ?? null, items: el.children.length };
    });

  test("wraps its children in the matching element, and swaps as the viewport changes", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(page, LIST, MODULES);
    expect(await wrapper(page)).toEqual({ tag: "ol", className: "steps", kind: "numbered", items: 2 });
    await page.setViewportSize(NARROW);
    await expect.poll(() => wrapper(page)).toEqual({ tag: "ul", className: "plain", kind: null, items: 2 });
  });

  test("the default wrapper holds the children from the start", async ({ page }) => {
    await page.setViewportSize(NARROW);
    await mount(page, LIST, MODULES);
    expect(await wrapper(page)).toMatchObject({ tag: "ul", items: 2 });
    expect(await page.evaluate(() => document.getElementById("q").children.length)).toBe(1);
  });

  test("keeps working after a move, and wraps children added later", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(page, LIST, MODULES);
    await page.evaluate(() => {
      const q = document.getElementById("q");
      document.body.prepend(q);
      q.insertAdjacentHTML("beforeend", "<li>c</li>");
    });
    await expect.poll(() => wrapper(page)).toMatchObject({ tag: "ol", items: 3 });
    await page.setViewportSize(NARROW);
    await expect.poll(() => wrapper(page)).toMatchObject({ tag: "ul", items: 3 });
  });

  test("loads with no import map (no third-party dependency)", async ({ page }) => {
    await page.goto("/test/browser/fixture.html");
    const ok = await page.evaluate(async () => {
      document.querySelector('script[type="importmap"]')?.remove();
      await import("/src/matchable/query-container/global.mjs");
      document.body.innerHTML = '<query-container default="ol"><li>x</li></query-container>';
      return document.querySelector("query-container ol li") !== null;
    });
    expect(ok).toBe(true);
  });
});

test.describe("attribute-provider", () => {
  const CARDS = `
    <attribute-provider id="ap"
      classes="base | [(min-width: 600px)] wide | [(max-width: 599px)] narrow"
      styles="[(max-width: 599px)] border-color: red; color: blue"
      attributes="[(max-width: 599px)] title=narrow; data-mode=compact | [(min-width: 600px)] hidden=null"
    >
      <div id="a" class="card base" style="color: green" title="original" hidden></div>
    </attribute-provider>`;
  const read = (page) =>
    page.evaluate(() => {
      const a = document.getElementById("a");
      return {
        classes: [...a.classList],
        color: a.style.color,
        border: a.style.borderColor,
        title: a.getAttribute("title"),
        mode: a.getAttribute("data-mode"),
        hidden: a.hasAttribute("hidden"),
      };
    });

  test("adds to what the child already has, and restores it when queries stop matching", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(page, CARDS, MODULES);
    expect(await read(page)).toEqual({
      classes: ["card", "base", "wide"],
      color: "green",
      border: "",
      title: "original",
      mode: null,
      hidden: false,
    });
    await page.setViewportSize(NARROW);
    await expect.poll(() => read(page)).toEqual({
      classes: ["card", "base", "narrow"],
      color: "blue",
      border: "red",
      title: "narrow",
      mode: "compact",
      hidden: true,
    });
    await page.setViewportSize(WIDE);
    await expect.poll(() => read(page), "everything it changed is restored").toEqual({
      classes: ["card", "base", "wide"],
      color: "green",
      border: "",
      title: "original",
      mode: null,
      hidden: false,
    });
  });

  test("a class the child already had is never removed", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(page, CARDS, MODULES);
    await page.evaluate(() => document.getElementById("ap").setAttribute("classes", ""));
    expect((await read(page)).classes, "`base` was the child's own").toEqual(["card", "base"]);
  });

  test("children added later get the current state; children removed are restored", async ({ page }) => {
    await page.setViewportSize(NARROW);
    await mount(page, CARDS, MODULES);
    const added = await page.evaluate(async () => {
      const ap = document.getElementById("ap");
      ap.insertAdjacentHTML("beforeend", '<p id="b" class="mine"></p>');
      await new Promise((r) => setTimeout(r));
      const b = document.getElementById("b");
      const a = document.getElementById("a");
      document.body.append(a); // leaves the provider
      await new Promise((r) => setTimeout(r));
      return { b: b.className, a: a.className, aTitle: a.title };
    });
    expect(added).toEqual({ b: "mine base narrow", a: "card base", aTitle: "original" });
  });

  test("survives a move", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(page, CARDS, MODULES);
    await page.evaluate(() => document.body.prepend(document.getElementById("ap")));
    await page.setViewportSize(NARROW);
    await expect.poll(() => read(page).then((r) => r.classes)).toEqual(["card", "base", "narrow"]);
  });
});

test.describe("container mode", () => {
  const setWidth = (page, id, px) => page.evaluate(([id, px]) => (document.getElementById(id).style.width = `${px}px`), [id, px]);

  test("query-container follows its parent's width, not the viewport", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(
      page,
      `<div id="box" style="width: 300px">
         <query-container id="q" container default="ul" query="[(min-width: 400px)] ol.wide"><li>a</li></query-container>
       </div>`,
      MODULES,
    );
    const tag = () => page.evaluate(() => document.getElementById("q").firstElementChild.localName);
    expect(await tag(), "a 1000px viewport doesn't matter; the 300px box does").toBe("ul");
    await setWidth(page, "box", 500);
    await expect.poll(tag).toBe("ol");
    await setWidth(page, "box", 300);
    await expect.poll(tag).toBe("ul");
  });

  test("a selector picks the closest matching ancestor; range syntax and em work", async ({ page }) => {
    await mount(
      page,
      `<section id="card" style="width: 300px; font-size: 20px"><div><div>
         <attribute-provider id="ap" container="#card" classes="[(width >= 20em)] roomy | [(width < 20em)] cramped"><p id="p"></p></attribute-provider>
       </div></div></section>`,
      MODULES,
    );
    const classes = () => page.evaluate(() => document.getElementById("p").className);
    expect(await classes()).toBe("cramped");
    await setWidth(page, "card", 400);
    await expect.poll(classes).toBe("roomy");
  });

  test("re-resolves its container after a move, and stops observing when removed", async ({ page }) => {
    await mount(
      page,
      `<div id="small" style="width: 200px"><query-container id="q" container default="ul" query="[(min-width: 400px)] ol"><li>a</li></query-container></div>
       <div id="large" style="width: 600px"></div>`,
      MODULES,
    );
    const tag = () => page.evaluate(() => document.getElementById("q").firstElementChild.localName);
    expect(await tag()).toBe("ul");
    await page.evaluate(() => document.getElementById("large").append(document.getElementById("q")));
    await expect.poll(tag).toBe("ol");
    // removed: resizing its old container must not throw or update it
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.evaluate(() => document.getElementById("q").remove());
    await setWidth(page, "large", 100);
    await page.waitForTimeout(100);
    expect(errors).toEqual([]);
  });

  test("toggling the container attribute switches between viewport and container", async ({ page }) => {
    await page.setViewportSize(WIDE);
    await mount(
      page,
      `<div style="width: 300px"><query-container id="q" default="ul" query="[(min-width: 400px)] ol"><li>a</li></query-container></div>`,
      MODULES,
    );
    const tag = () => page.evaluate(() => document.getElementById("q").firstElementChild.localName);
    expect(await tag(), "viewport mode: 1000px matches").toBe("ol");
    await page.evaluate(() => document.getElementById("q").setAttribute("container", ""));
    await expect.poll(tag).toBe("ul");
    await page.evaluate(() => document.getElementById("q").removeAttribute("container"));
    await expect.poll(tag).toBe("ol");
  });
});
