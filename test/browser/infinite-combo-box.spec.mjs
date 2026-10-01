import { test, expect } from "@playwright/test";
import { axNames, mount, recordEvents } from "./helpers.mjs";

const MODULES = ["src/infinite-combo-box/global.mjs"];
const LOCAL = `
  <form id="f">
    <label for="c">City</label>
    <infinite-combo-box id="c" name="city" placeholder="Search cities">
      <option value="nyc">New York</option>
      <option value="sf">San Francisco</option>
      <option value="sea">Seattle</option>
      <option value="nor" disabled>Nowhere</option>
    </infinite-combo-box>
    <button id="submit">Submit</button>
  </form>`;

const input = (page) => page.getByRole("combobox");
const read = (page) =>
  page.evaluate(() => {
    const c = document.getElementById("c");
    return {
      value: c.value,
      text: c.input.value,
      open: c.open,
      expanded: c.input.getAttribute("aria-expanded"),
      options: c.options.map((o) => o.textContent.trim()),
      form: [...new FormData(document.getElementById("f"))],
    };
  });

test("is a labelled combobox controlling a listbox", async ({ page, browserName }) => {
  await mount(page, LOCAL, MODULES);
  await expect(input(page)).toHaveAttribute("aria-autocomplete", "list");
  await expect(input(page)).toHaveAttribute("aria-expanded", "false");
  await expect(input(page)).toHaveAttribute("placeholder", "Search cities");
  const controls = await input(page).getAttribute("aria-controls");
  await expect(page.locator(`#${controls}`)).toHaveAttribute("role", "listbox");
  await expect(page.getByRole("combobox", { name: "City" })).toHaveCount(1);
  const names = await axNames(page, browserName, "combobox");
  if (names) expect(names).toEqual(["City"]);
});

test("clicking the label focuses the input", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await page.getByText("City", { exact: true }).click();
  await expect(input(page)).toBeFocused();
});

test("typing filters the markup's own options", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await input(page).fill("s");
  expect(await read(page)).toMatchObject({ open: true, expanded: "true", options: ["San Francisco", "Seattle"] });
  await input(page).fill("sea");
  expect((await read(page)).options).toEqual(["Seattle"]);
  await expect(page.getByRole("status")).toHaveText("1 result available.");
});

test("keyboard: Down opens and moves, Enter chooses, Escape closes then clears", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await input(page).focus();
  await page.keyboard.press("ArrowDown");
  expect((await read(page)).open).toBe(true);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const active = await page.evaluate(() => {
    const c = document.getElementById("c");
    return document.getElementById(c.input.getAttribute("aria-activedescendant"))?.textContent;
  });
  expect(active).toBe("San Francisco");
  await page.keyboard.press("Enter");
  expect(await read(page)).toMatchObject({ value: "sf", text: "San Francisco", open: false });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  expect((await read(page)).open).toBe(false);
  await page.keyboard.press("Escape");
  expect((await read(page)).text).toBe("");
});

test("Up from the top wraps to the last enabled option; disabled options are skipped", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await input(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  expect((await read(page)).value).toBe("sea");
});

test("clicking an option chooses it and fires input then change", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  const events = await recordEvents(page, ["input", "change"]);
  await input(page).fill("new");
  expect(await events.take(), "typing in select-only mode doesn't change the value").toEqual([]);
  await page.getByRole("option", { name: "New York" }).click();
  expect(await read(page)).toMatchObject({ value: "nyc", text: "New York", form: [["city", "nyc"]] });
  expect(await events.take()).toEqual([["input", "c"], ["change", "c"]]);
  await expect(input(page)).toBeFocused();
});

test("select-only: stray text is reverted on blur; clearing the text clears the value", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await input(page).fill("sea");
  await page.getByRole("option", { name: "Seattle" }).click();
  await input(page).fill("zzz");
  await page.locator("#submit").focus();
  expect(await read(page)).toMatchObject({ value: "sea", text: "Seattle" });
  const events = await recordEvents(page, ["input", "change"]);
  await input(page).fill("");
  await page.locator("#submit").focus();
  expect(await read(page)).toMatchObject({ value: "", form: [] });
  expect(await events.take()).toEqual([["input", "c"], ["change", "c"]]);
});

test("allow-custom: the typed text is the value; change fires on commit", async ({ page }) => {
  await mount(page, LOCAL.replace('name="city"', 'name="city" allow-custom'), MODULES);
  const events = await recordEvents(page, ["input", "change"]);
  await input(page).fill("Atlantis");
  expect(await read(page)).toMatchObject({ value: "Atlantis", form: [["city", "Atlantis"]] });
  expect((await events.take()).every(([type]) => type === "input")).toBe(true);
  await page.locator("#submit").focus();
  expect(await events.take()).toEqual([["change", "c"]]);
});

test("Enter chooses without submitting the form", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await page.evaluate(() => {
    window.submitted = 0;
    document.getElementById("f").addEventListener("submit", (e) => (e.preventDefault(), window.submitted++));
  });
  await input(page).fill("sea");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.submitted)).toBe(0);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.submitted), "with the list closed, Enter submits like any input").toBe(1);
});

test("value, the value attribute, and form.reset()", async ({ page }) => {
  await mount(page, LOCAL.replace('name="city"', 'name="city" value="sf"'), MODULES);
  expect(await read(page)).toMatchObject({ value: "sf", text: "San Francisco" });
  const events = await recordEvents(page, ["input", "change"]);
  await page.evaluate(() => (document.getElementById("c").value = "Seattle"));
  expect(await read(page), "matches by label too").toMatchObject({ value: "sea", text: "Seattle" });
  await page.evaluate(() => (document.getElementById("c").value = "nope"));
  expect((await read(page)).value).toBe("");
  expect(await events.take(), "script changes are silent").toEqual([]);
  await page.evaluate(() => document.getElementById("f").reset());
  expect(await read(page)).toMatchObject({ value: "sf", text: "San Francisco" });
});

test("required and disabled behave like native form controls", async ({ page }) => {
  await mount(page, LOCAL.replace('name="city"', 'name="city" required'), MODULES);
  expect(await page.evaluate(() => [document.getElementById("f").checkValidity(), document.getElementById("c").matches(":invalid")])).toEqual([false, true]);
  await input(page).fill("new");
  await page.getByRole("option", { name: "New York" }).click();
  expect(await page.evaluate(() => document.getElementById("f").checkValidity())).toBe(true);
  await page.evaluate(() => (document.getElementById("c").disabled = true));
  await expect(input(page)).toBeDisabled();
  expect((await read(page)).form).toEqual([]);
});

test("src: fetches JSON results for the typed query, debounced, newest wins", async ({ page }) => {
  let requests = [];
  await page.route("**/api/cities?**", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q");
    requests.push(q);
    // the first request is slow, so a stale response arrives last
    if (q === "b") await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ json: [{ value: `${q}-1`, label: `${q} one` }, `${q} two`] });
  });
  await mount(page, `<infinite-combo-box id="c" src="/api/cities?q={query}" debounce="0"></infinite-combo-box>`, MODULES);
  await input(page).pressSequentially("b");
  await input(page).pressSequentially("o");
  await expect(page.getByRole("option", { name: "bo one" })).toBeVisible();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.getElementById("c").options.map((o) => o.textContent)), "the stale 'b' response is ignored").toEqual(["bo one", "bo two"]);
  expect(requests).toEqual(["b", "bo"]);

  requests = [];
  await page.evaluate(() => document.getElementById("c").setAttribute("debounce", "150"));
  await input(page).fill("");
  await input(page).pressSequentially("xyz", { delay: 20 });
  await expect(page.getByRole("option", { name: "xyz one" })).toBeVisible();
  expect(requests, "debounced to the final query").toEqual(["xyz"]);
});

test("src: HTML responses work too, and errors are reported, not thrown", async ({ page }) => {
  await page.route("**/html?**", (route) =>
    route.fulfill({ contentType: "text/html", body: '<option value="a">Alpha</option><option value="b">Beta</option>' }),
  );
  await page.route("**/broken?**", (route) => route.fulfill({ status: 500 }));
  await mount(page, `<infinite-combo-box id="c" src="/html?q={query}" debounce="0"></infinite-combo-box>`, MODULES);
  await input(page).fill("x");
  await page.getByRole("option", { name: "Beta" }).click();
  expect(await page.evaluate(() => document.getElementById("c").value)).toBe("b");
  const errors = await page.evaluate(async () => {
    const c = document.getElementById("c");
    const seen = [];
    c.addEventListener("error", (e) => seen.push(e.message));
    c.src = "/broken?q={query}";
    c.input.value = "y";
    c.input.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 300));
    return seen;
  });
  expect(errors).toEqual(["500 Internal Server Error"]);
  await expect(page.getByRole("status")).toHaveText("Couldn't load results.");
});

test("searchFunction: any async source, with cancellation", async ({ page }) => {
  await mount(page, `<infinite-combo-box id="c" debounce="0"></infinite-combo-box>`, MODULES);
  const aborted = await page.evaluate(async () => {
    const c = document.getElementById("c");
    let aborts = 0;
    c.searchFunction = async (query, { signal }) => {
      signal.addEventListener("abort", () => aborts++);
      await new Promise((r) => setTimeout(r, 50));
      return query.split("").map((ch) => ({ value: ch, label: `letter ${ch}` }));
    };
    for (const text of ["a", "ab"]) {
      c.input.value = text;
      c.input.dispatchEvent(new Event("input"));
    }
    await new Promise((r) => setTimeout(r, 150));
    return { aborts, options: c.options.map((o) => o.textContent) };
  });
  expect(aborted).toEqual({ aborts: 1, options: ["letter a", "letter b"] });
});

test("toggle events report open/closed like a popover", async ({ page }) => {
  await mount(page, LOCAL, MODULES);
  await page.evaluate(() => {
    window.toggles = [];
    document.getElementById("c").addEventListener("toggle", (e) => window.toggles.push(`${e.oldState}->${e.newState}`));
  });
  await input(page).fill("s");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.toggles)).toEqual(["closed->open", "open->closed"]);
});

test("an author-written input is used, and the element survives a move", async ({ page }) => {
  await mount(
    page,
    `<form id="f"><infinite-combo-box id="c" name="city"><input type="search" class="mine" /><option value="1">One</option></infinite-combo-box></form>`,
    MODULES,
  );
  expect(await page.evaluate(() => document.querySelectorAll("infinite-combo-box input").length)).toBe(1);
  await expect(page.locator("input.mine")).toHaveAttribute("role", "combobox");
  await page.evaluate(() => document.body.append(document.getElementById("f")));
  await input(page).fill("o");
  await page.getByRole("option", { name: "One" }).click();
  expect((await read(page)).form).toEqual([["city", "1"]]);
});

test.describe("paging", () => {
  // 95 results, pages of 20: next cursor = offset, total reported.
  const routePages = (page, { delayFor } = {}) =>
    page.route("**/api/items?**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q");
      const cursor = Number(url.searchParams.get("cursor") || 0);
      if (delayFor && delayFor(q, cursor)) await new Promise((r) => setTimeout(r, 400));
      const items = Array.from({ length: Math.min(20, 95 - cursor) }, (_, i) => ({ value: `${q}-${cursor + i}`, label: `${q} ${cursor + i}` }));
      const next = cursor + 20 < 95 ? String(cursor + 20) : null;
      await route.fulfill({ json: { options: items, next, total: 95 } });
    });
  const SETUP = (attrs) =>
    `<link rel="stylesheet" href="/src/infinite-combo-box/index.css" /><infinite-combo-box id="c" debounce="0" ${attrs}></infinite-combo-box>`;
  const count = (page) => page.evaluate(() => document.getElementById("c").options.length);

  test("scrolling to the end loads the next page, until there are no more", async ({ page }) => {
    await routePages(page);
    await mount(page, SETUP('src="/api/items?q={query}&cursor={cursor}"'), MODULES);
    await input(page).fill("x");
    await expect.poll(() => count(page)).toBe(20);
    expect(await page.evaluate(() => document.getElementById("c").hasMore)).toBe(true);
    await expect(page.getByRole("status")).toHaveText("20 of 95 results shown.");
    for (const expected of [40, 60, 80, 95]) {
      await page.locator("[data-load-more]").scrollIntoViewIfNeeded();
      await expect.poll(() => count(page)).toBe(expected);
    }
    await expect(page.locator("[data-load-more]")).toHaveCount(0);
    expect(await page.evaluate(() => document.getElementById("c").hasMore)).toBe(false);
    const positions = await page.evaluate(() => {
      const options = document.getElementById("c").options;
      return [options[0].getAttribute("aria-posinset"), options[94].getAttribute("aria-posinset"), options[94].getAttribute("aria-setsize")];
    });
    expect(positions).toEqual(["1", "95", "95"]);
  });

  test("arrowing onto 'Load more results' loads the next page and keeps the keyboard there", async ({ page }) => {
    await routePages(page);
    await mount(page, SETUP('src="/api/items?q={query}"'), MODULES);
    await input(page).fill("k");
    await expect.poll(() => count(page)).toBe(20);
    // Stop the scroll trigger so only the keyboard drives this test.
    await page.evaluate(() => (document.querySelector("[role=listbox]").style.maxBlockSize = "none"));
    for (let i = 0; i < 21; i++) await page.keyboard.press("ArrowDown");
    await expect.poll(() => count(page)).toBeGreaterThanOrEqual(40);
    const active = await page.evaluate(() => document.getElementById(document.getElementById("c").input.getAttribute("aria-activedescendant"))?.textContent);
    expect(active, "the first newly loaded option is active").toBe("k 20");
    await expect(page.getByRole("status")).toContainText("more results loaded");
  });

  test("a new query cancels an in-flight page; stale pages never appear", async ({ page }) => {
    await routePages(page, { delayFor: (q, cursor) => q === "a" && cursor === 20 });
    await mount(page, SETUP('src="/api/items?q={query}"'), MODULES);
    await page.evaluate(() => (document.querySelector("[role=listbox]") ?? document.body).style.setProperty("max-block-size", "none"));
    await input(page).fill("a");
    await expect.poll(() => count(page)).toBe(20);
    const loading = page.evaluate(() => document.getElementById("c").loadMore()); // slow page 2 of "a"
    await input(page).fill("b");
    await loading;
    await page.waitForTimeout(500);
    const labels = await page.evaluate(() => document.getElementById("c").options.map((o) => o.textContent));
    expect(labels.every((label) => label.startsWith("b ")), "no 'a' results leaked in").toBe(true);
  });

  test("searchFunction gets the cursor; HTML responses carry it with data-next", async ({ page }) => {
    await page.route("**/html?**", (route) => {
      const cursor = new URL(route.request().url()).searchParams.get("cursor");
      route.fulfill({
        contentType: "text/html",
        body: cursor ? '<option value="b">Beta</option>' : '<option value="a">Alpha</option><span data-next="p2"></span>',
      });
    });
    await mount(page, SETUP('src="/html?q={query}"'), MODULES);
    await input(page).fill("x");
    // Page 1 is short, so "Load more" is already in view and page 2 loads by itself.
    await expect
      .poll(() => page.evaluate(() => document.getElementById("c").options.map((o) => o.textContent)))
      .toEqual(["Alpha", "Beta"]);
    expect(await page.evaluate(() => document.getElementById("c").hasMore)).toBe(false);

    const cursors = await page.evaluate(async () => {
      const c = document.getElementById("c");
      const seen = [];
      c.searchFunction = async (query, { cursor }) => {
        seen.push(cursor);
        return { options: [`${query}${cursor || 0}`], next: cursor ? null : "1" };
      };
      c.input.value = "q";
      c.input.dispatchEvent(new Event("input"));
      await new Promise((r) => setTimeout(r, 50));
      await c.loadMore();
      return { seen, labels: c.options.map((o) => o.textContent) };
    });
    expect(cursors).toEqual({ seen: ["", "1"], labels: ["q0", "q1"] });
  });

  test("page-size pages through the markup's own options", async ({ page }) => {
    const options = Array.from({ length: 120 }, (_, i) => `<option>Item ${i}</option>`).join("");
    await mount(page, `<link rel="stylesheet" href="/src/infinite-combo-box/index.css" /><infinite-combo-box id="c" page-size="25">${options}</infinite-combo-box>`, MODULES);
    await input(page).fill("item");
    await expect.poll(() => count(page)).toBe(25);
    await page.locator("[data-load-more]").scrollIntoViewIfNeeded();
    await expect.poll(() => count(page)).toBe(50);
    await input(page).fill("item 1");
    await expect.poll(() => count(page), "a new query starts again at one page").toBe(25);
    expect(await page.evaluate(() => document.getElementById("c").options[0].getAttribute("aria-setsize"))).toBe("31");
    expect(await page.evaluate(() => document.querySelector("#c [role=listbox]").scrollTop), "new results start at the top").toBe(0);
  });

  test("a failing later page reports an error and keeps what's loaded", async ({ page }) => {
    await page.route("**/flaky?**", (route) => {
      const cursor = new URL(route.request().url()).searchParams.get("cursor");
      return cursor ? route.fulfill({ status: 503 }) : route.fulfill({ json: { options: ["one", "two"], next: "2" } });
    });
    await mount(page, SETUP('src="/flaky?q={query}"'), MODULES);
    const errors = await page.evaluate(() => {
      window.errs = [];
      document.getElementById("c").addEventListener("error", (e) => window.errs.push(e.message));
    });
    void errors;
    await input(page).fill("z");
    await expect.poll(() => count(page)).toBe(2);
    // "Load more" is in view, so page 2 is requested automatically and fails.
    await expect.poll(() => page.evaluate(() => window.errs)).toEqual(["503 Service Unavailable"]);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.errs.length), "a failed page isn't retried in a loop").toBe(1);
    expect(await count(page)).toBe(2);
    await expect(page.getByRole("status")).toHaveText("Couldn't load more results.");
    await expect(page.locator("[data-load-more]"), "can retry").toHaveCount(1);
  });
});

test.describe("floating list", () => {
  const OPTIONS = Array.from({ length: 30 }, (_, i) => `<option>Item ${i}</option>`).join("");
  const geometry = (page) =>
    page.evaluate(() => {
      const c = document.getElementById("c");
      const list = c.querySelector("[role=listbox]");
      const input = c.input.getBoundingClientRect();
      const box = list.getBoundingClientRect();
      const first = c.options[0].getBoundingClientRect();
      const hit = document.elementFromPoint(first.left + 5, first.top + first.height / 2);
      return {
        popover: list.matches(":popover-open"),
        placement: list.dataset.placement,
        alignedLeft: Math.abs(box.left - input.left) < 1,
        sameWidth: Math.abs(box.width - input.width) < 1,
        gapBelow: Math.round(box.top - input.bottom),
        gapAbove: Math.round(input.top - box.bottom),
        firstOptionReachable: hit === c.options[0] || c.options[0].contains(hit),
        fitsViewport: box.top >= 0 && box.bottom <= document.documentElement.clientHeight + 1,
      };
    });

  test("escapes a clipping container, with no stylesheet at all", async ({ page }) => {
    await mount(
      page,
      `<div style="overflow: hidden; height: 3em; border: 1px solid">
         <infinite-combo-box id="c">${OPTIONS}</infinite-combo-box>
       </div>`,
      MODULES,
    );
    await input(page).fill("item");
    expect(await geometry(page)).toMatchObject({
      popover: true,
      placement: "below",
      alignedLeft: true,
      sameWidth: true,
      gapBelow: 4,
      firstOptionReachable: true,
      fitsViewport: true,
    });
  });

  test("flips above the input when there's no room below", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 500 });
    await mount(page, `<div style="height: 420px"></div><infinite-combo-box id="c">${OPTIONS}</infinite-combo-box>`, MODULES);
    await input(page).fill("item");
    expect(await geometry(page)).toMatchObject({ placement: "above", gapAbove: 4, fitsViewport: true, firstOptionReachable: true });
  });

  test("follows the input when an ancestor scrolls", async ({ page }) => {
    await mount(
      page,
      `<div id="scroller" style="height: 200px; overflow: auto"><div style="height: 60px"></div>
         <infinite-combo-box id="c">${OPTIONS}</infinite-combo-box><div style="height: 600px"></div></div>`,
      MODULES,
    );
    await input(page).fill("item");
    const before = (await geometry(page)).gapBelow;
    await page.evaluate(() => (document.getElementById("scroller").scrollTop = 40));
    await expect.poll(async () => (await geometry(page)).gapBelow).toBe(before);
  });

  test("inline keeps the list in the normal flow", async ({ page }) => {
    await mount(page, `<infinite-combo-box id="c" inline>${OPTIONS}</infinite-combo-box>`, MODULES);
    await input(page).fill("item");
    const result = await page.evaluate(() => {
      const list = document.querySelector("#c [role=listbox]");
      return { popover: list.hasAttribute("popover"), visible: list.checkVisibility() };
    });
    expect(result).toEqual({ popover: false, visible: true });
  });

  test("closing hides the popover and stops tracking", async ({ page }) => {
    await mount(page, `<infinite-combo-box id="c">${OPTIONS}</infinite-combo-box>`, MODULES);
    await input(page).fill("item");
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.querySelector("#c [role=listbox]").matches(":popover-open"))).toBe(false);
    await expect(page.getByRole("listbox")).toBeHidden();
  });
});

test.describe("strings", () => {
  test("a data-strings JSON child translates the element (with plurals)", async ({ page }) => {
    await mount(
      page,
      `<div lang="es"><infinite-combo-box id="c" page-size="2">
         <script type="application/json" data-strings>
           { "noResults": "Sin resultados.", "loadMore": "Cargar más",
             "loadedMoreOfTotal": { "one": "{count} resultado más, {shown} de {total}", "other": "{count} resultados más, {shown} de {total}" } }
         </script>
         <option>uno</option><option>dos</option><option>ocho</option>
       </infinite-combo-box></div>`,
      MODULES,
    );
    await input(page).fill("o");
    // The 2-item first page leaves "Load more" in view, so page 2 loads at once.
    await expect(page.getByRole("status")).toHaveText("1 resultado más, 3 de 3");
    expect(await page.evaluate(() => document.getElementById("c").strings.loadMore)).toBe("Cargar más");
    await input(page).fill("zzz");
    await expect(page.getByRole("status")).toHaveText("Sin resultados.");
  });

  test("plural categories and number formats follow the element's language", async ({ page }) => {
    await page.route("**/many?**", (route) => route.fulfill({ json: { options: ["a", "b", "c"], next: null, total: 12345 } }));
    // (next: null, so no second page auto-loads and replaces the announcement)
    await mount(
      page,
      `<div lang="pl"><infinite-combo-box id="c" src="/many?q={query}" debounce="0"></infinite-combo-box></div>`,
      MODULES,
    );
    await page.evaluate(() => {
      document.getElementById("c").strings = {
        // Polish: one / few / many
        available: { one: "{count} wynik", few: "{count} wyniki", many: "{count} wyników", other: "{count} wyniku" },
        shownOfTotal: "{shown} z {total}",
      };
    });
    await input(page).fill("x");
    await expect(page.getByRole("status")).toHaveText(/^3 z 12\s345$/); // pl groups thousands with a (narrow) space
    // Polish "few" plural: 3 results, with no total reported.
    await page.unroute("**/many?**");
    await page.route("**/many?**", (route) => route.fulfill({ json: { options: ["a", "b", "c"], next: null } }));
    await input(page).fill("y");
    await expect(page.getByRole("status")).toHaveText("3 wyniki");
  });

  test("validation messages are the browser's own, like native controls", async ({ page }) => {
    await mount(
      page,
      `<form><infinite-combo-box id="c" required><option>a</option></infinite-combo-box>
         <stylable-select id="s" required><option>a</option></stylable-select>
         <input id="native" required /><select id="nativeSelect" required multiple><option>a</option></select></form>`,
      [...MODULES, "src/stylable-select/global.mjs"],
    );
    const messages = await page.evaluate(() => ({
      combo: document.getElementById("c").validationMessage,
      input: document.getElementById("native").validationMessage,
      select: document.getElementById("s").validationMessage,
      nativeSelect: document.getElementById("nativeSelect").validationMessage,
    }));
    expect(messages.combo).toBe(messages.input);
    expect(messages.select).toBe(messages.nativeSelect);
  });
});
