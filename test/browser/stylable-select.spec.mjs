import { test, expect } from "@playwright/test";
import { axNames, mount, recordEvents } from "./helpers.mjs";

const MODULES = ["src/stylable-select/global.mjs"];
const FRUIT = `
  <form id="f">
    <label for="s">Fruit</label>
    <stylable-select id="s" name="fruit">
      <optgroup label="Common">
        <option value="apple">Apple</option>
        <option value="banana" selected>Banana</option>
      </optgroup>
      <optgroup label="Rare" disabled>
        <option value="durian">Durian</option>
      </optgroup>
      <div role="option" data-value="cherry">Cherry</div>
      <option>Elderberry</option>
    </stylable-select>
  </form>`;

const read = (page) =>
  page.evaluate(() => {
    const s = document.getElementById("s");
    return {
      value: s.value,
      selectedIndex: s.selectedIndex,
      selected: s.selectedOptions.map((o) => o.textContent.trim()),
      form: [...new FormData(document.getElementById("f")).entries()],
    };
  });

test("exposes the HTMLSelectElement contract", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  const api = await page.evaluate(() => {
    const s = document.getElementById("s");
    return {
      length: s.length,
      type: s.type,
      values: s.options.map((o) => (o.value ?? o.dataset.value)),
      item1: s.item(1).textContent,
      name: s.name,
      formIsForm: s.form === document.getElementById("f"),
      labels: [...s.labels].map((l) => l.textContent),
    };
  });
  expect(api).toEqual({
    length: 5,
    type: "select-one",
    values: ["apple", "banana", "durian", "cherry", "Elderberry"],
    item1: "Banana",
    name: "fruit",
    formIsForm: true,
    labels: ["Fruit"],
  });
  expect(await read(page)).toMatchObject({ value: "banana", selectedIndex: 1 });
});

test("is an accessible listbox with a label", async ({ page, browserName }) => {
  await mount(page, FRUIT, MODULES);
  await expect(page.getByRole("listbox")).toHaveCount(1);
  const names = await axNames(page, browserName, "listbox");
  if (names) expect(names, "named by its <label for>").toEqual(["Fruit"]);
  await expect(page.getByRole("option")).toHaveCount(5);
  await expect(page.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option", { name: "Durian" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("group", { name: "Common" })).toHaveCount(1);
});

test("submits its value with the form, and form.reset() restores the default", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  expect((await read(page)).form).toEqual([["fruit", "banana"]]);
  await page.getByRole("option", { name: "Cherry" }).click();
  expect(await read(page)).toMatchObject({ value: "cherry", form: [["fruit", "cherry"]] });
  await page.evaluate(() => document.getElementById("f").reset());
  expect(await read(page)).toMatchObject({ value: "banana", form: [["fruit", "banana"]] });
});

test("clicking fires input then change; script changes fire nothing", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  const events = await recordEvents(page, ["input", "change"]);
  await page.getByRole("option", { name: "Apple" }).click();
  expect(await events.take()).toEqual([["input", "s"], ["change", "s"]]);
  await page.getByRole("option", { name: "Apple" }).click();
  expect(await events.take(), "no change when nothing changed").toEqual([]);
  await page.evaluate(() => {
    const s = document.getElementById("s");
    s.value = "cherry";
    s.selectedIndex = 0;
  });
  expect(await events.take()).toEqual([]);
  expect((await read(page)).value).toBe("apple");
});

test("value and selectedIndex setters behave like a native select's", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  const results = await page.evaluate(() => {
    const s = document.getElementById("s");
    const out = [];
    s.value = "Elderberry";
    out.push([s.value, s.selectedIndex]);
    s.value = "nope";
    out.push([s.value, s.selectedIndex]);
    s.selectedIndex = 3;
    out.push([s.value, s.selectedIndex]);
    s.selectedIndex = -1;
    out.push([s.value, s.selectedIndex]);
    return out;
  });
  expect(results).toEqual([["Elderberry", 4], ["", -1], ["cherry", 3], ["", -1]]);
});

test("disabled options and groups can't be chosen", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  await page.getByRole("option", { name: "Durian" }).click({ force: true });
  expect((await read(page)).value).toBe("banana");
});

test("keyboard: arrows, Home/End skip disabled; typeahead selects", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  await page.locator("#s").focus();
  await page.keyboard.press("ArrowDown");
  expect((await read(page)).value, "skips disabled Durian").toBe("cherry");
  await page.keyboard.press("End");
  expect((await read(page)).value).toBe("Elderberry");
  await page.keyboard.press("Home");
  expect((await read(page)).value).toBe("apple");
  await page.keyboard.type("ch");
  expect((await read(page)).value).toBe("cherry");
  const active = await page.evaluate(() => {
    const s = document.getElementById("s");
    return s.getAttribute("aria-activedescendant") === s.selectedOptions[0].id;
  });
  expect(active).toBe(true);
});

test("keyboard changes fire input and change", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  const events = await recordEvents(page, ["input", "change"]);
  await page.locator("#s").focus();
  await page.keyboard.press("ArrowUp");
  expect(await events.take()).toEqual([["input", "s"], ["change", "s"]]);
});

test("multiple: clicks and Space toggle; every value is submitted", async ({ page }) => {
  await mount(page, FRUIT.replace('name="fruit"', 'name="fruit" multiple'), MODULES);
  await expect(page.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
  await page.getByRole("option", { name: "Apple" }).click();
  await page.getByRole("option", { name: "Cherry" }).click();
  expect((await read(page)).form).toEqual([["fruit", "apple"], ["fruit", "banana"], ["fruit", "cherry"]]);
  await page.getByRole("option", { name: "Banana" }).click();
  expect((await read(page)).selected).toEqual(["Apple", "Cherry"]);
  await page.locator("#s").focus();
  await page.keyboard.press("End");
  await page.keyboard.press(" ");
  expect((await read(page)).selected).toEqual(["Apple", "Cherry", "Elderberry"]);
  expect(await page.evaluate(() => document.getElementById("s").type)).toBe("select-multiple");
});

test("required participates in validation", async ({ page }) => {
  await mount(page, FRUIT.replace("<option value=\"banana\" selected>", "<option value=\"banana\">").replace('name="fruit"', 'name="fruit" required'), MODULES);
  const before = await page.evaluate(() => ({
    valid: document.getElementById("f").checkValidity(),
    invalid: document.getElementById("s").matches(":invalid"),
    missing: document.getElementById("s").validity.valueMissing,
  }));
  expect(before).toEqual({ valid: false, invalid: true, missing: true });
  await page.getByRole("option", { name: "Apple" }).click();
  expect(await page.evaluate(() => document.getElementById("f").checkValidity())).toBe(true);
  await page.evaluate(() => document.getElementById("s").setCustomValidity("nope"));
  expect(await page.evaluate(() => document.getElementById("s").validity.customError)).toBe(true);
});

test("disabled, and a disabled fieldset, block interaction and submission", async ({ page }) => {
  await mount(page, FRUIT.replace("<label", "<fieldset id='fs'><label").replace("</form>", "</fieldset></form>"), MODULES);
  await page.evaluate(() => (document.getElementById("fs").disabled = true));
  const state = await page.evaluate(() => {
    const s = document.getElementById("s");
    return { matches: s.matches(":disabled"), tabindex: s.getAttribute("tabindex"), form: [...new FormData(document.getElementById("f"))] };
  });
  expect(state).toEqual({ matches: true, tabindex: null, form: [] });
  await page.getByRole("option", { name: "Apple" }).click({ force: true });
  expect((await read(page)).value).toBe("banana");
  await page.evaluate(() => (document.getElementById("fs").disabled = false));
  await page.evaluate(() => (document.getElementById("s").disabled = true));
  expect(await page.evaluate(() => document.getElementById("s").getAttribute("tabindex"))).toBeNull();
});

test("selected options match option:checked, like inside a native select", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  await page.getByRole("option", { name: "Elderberry" }).click();
  const checked = await page.evaluate(() =>
    [...document.querySelectorAll("#s option:checked")].map((o) => o.textContent),
  );
  expect(checked).toEqual(["Elderberry"]);
});

test("options added or removed later are picked up", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  await page.evaluate(() => {
    const s = document.getElementById("s");
    s.insertAdjacentHTML("beforeend", '<option value="fig">Fig</option>');
  });
  await page.getByRole("option", { name: "Fig" }).click();
  expect((await read(page)).value).toBe("fig");
  await page.evaluate(() => document.querySelector('option[value="fig"]').remove());
  expect((await read(page))).toMatchObject({ value: "", form: [] });
});

test("survives a move and works when built with createElement", async ({ page }) => {
  await mount(page, FRUIT, MODULES);
  await page.evaluate(() => document.body.prepend(document.getElementById("s")));
  await page.getByRole("option", { name: "Apple" }).click();
  expect(await page.evaluate(() => document.getElementById("s").value)).toBe("apple");
  const built = await page.evaluate(() => {
    const s = document.createElement("stylable-select");
    s.name = "n";
    s.innerHTML = "<option>x</option><option selected>y</option>";
    const form = document.createElement("form");
    form.append(s);
    document.body.append(form);
    return { value: s.value, data: [...new FormData(form)] };
  });
  expect(built).toEqual({ value: "y", data: [["n", "y"]] });
});

test("matches a native select's API and events for the same interactions", async ({ page }) => {
  await mount(
    page,
    `<select id="native" size="3"><option>a</option><option selected>b</option><option>c</option></select>
     <stylable-select id="custom"><option>a</option><option selected>b</option><option>c</option></stylable-select>`,
    MODULES,
  );
  const snapshot = () =>
    page.evaluate(() =>
      ["native", "custom"].map((id) => {
        const el = document.getElementById(id);
        return [el.value, el.selectedIndex, el.length, el.type, [...el.selectedOptions].length];
      }),
    );
  const [native0, custom0] = await snapshot();
  expect(custom0).toEqual(native0);
  for (const id of ["native", "custom"]) {
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      window[`events_${id}`] = [];
      for (const type of ["input", "change"]) el.addEventListener(type, () => window[`events_${id}`].push(type));
    }, id);
  }
  // (WebKit can't click options inside a native listbox select, so the
  // native one is driven with selectOption, which fires the same events.)
  await page.locator("#native").selectOption("c");
  await page.locator("#custom").getByText("c").click();
  const [native1, custom1] = await snapshot();
  expect(custom1).toEqual(native1);
  const events = await page.evaluate(() => [window.events_native, window.events_custom]);
  expect(events[1]).toEqual(events[0]);
});

test("clicking an option in a scrolled list selects that option (focus doesn't scroll it away)", async ({ page }) => {
  const options = Array.from({ length: 30 }, (_, i) => `<option${i === 0 ? " selected" : ""}>o${i}</option>`).join("");
  await mount(page, `<stylable-select id="s" style="display:block;height:120px;overflow:auto">${options}</stylable-select>`, MODULES);
  await page.evaluate(() => (document.getElementById("s").scrollTop = 10000));
  await page.getByRole("option", { name: "o29" }).click();
  expect(await page.evaluate(() => document.getElementById("s").value)).toBe("o29");
});
