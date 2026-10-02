// stylable-select is a stand-in for a native listbox <select> (`multiple`,
// or `size` > 1), which browsers are making fully stylable with
// `appearance: base-select`. The same options, in either element, must give
// the same results, so that moving from one to the other is a tag rename.
// Each check runs the same steps on both and compares what they report.
import { test, expect } from "@playwright/test";
import { mount } from "./helpers.mjs";

const MODULES = ["src/stylable-select/global.mjs"];

const OPTIONS = `
  <optgroup label="Common">
    <option value="apple">Apple</option>
    <option value="banana" selected>Banana</option>
  </optgroup>
  <optgroup label="Rare" disabled>
    <option value="durian">Durian</option>
  </optgroup>
  <option><b>Elder</b>berry</option>
  <option value="fig">Fig</option>`;

const PAGE = (attrs = "", { base = true } = {}) => `
  ${base ? "<style>select, ::picker(select) { appearance: base-select; }</style>" : ""}
  <form id="f-native"><select id="native" name="fruit" size="4" ${attrs}>${OPTIONS}</select></form>
  <form id="f-custom"><stylable-select id="custom" name="fruit" size="4" ${attrs}>${OPTIONS}</stylable-select></form>`;

// Run `steps` against each element (passed as `el`, its form as `form`),
// returning { native, custom }.
const both = (page, steps) =>
  page.evaluate((source) => {
    const run = new Function("el", "form", `return (${source})(el, form);`);
    const result = {};
    for (const id of ["native", "custom"]) {
      const el = document.getElementById(id);
      result[id] = run(el, el.form ?? document.getElementById(`f-${id}`));
    }
    return result;
  }, steps.toString());

const state = (el, form) => ({
  value: el.value,
  selectedIndex: el.selectedIndex,
  selected: [...el.selectedOptions].map((o) => o.textContent.trim()),
  checked: [...el.querySelectorAll("option:checked")].map((o) => o.textContent.trim()),
  length: el.length,
  type: el.type,
  form: [...new FormData(form).entries()],
  valid: el.checkValidity(),
});

const expectSame = ({ native, custom }) => expect(custom).toEqual(native);

for (const mode of ["single", "multiple"]) {
  const attrs = mode === "multiple" ? "multiple" : "";

  test.describe(`${mode}: stylable-select matches a native listbox <select>`, () => {
    test("initial state, values (including rich option text), and form data", async ({ page }) => {
      await mount(page, PAGE(attrs), MODULES);
      const result = await both(page, (el, form) => ({
        values: [...el.options].map((o) => o.value),
        value: el.value,
        selectedIndex: el.selectedIndex,
        length: el.length,
        type: el.type,
        form: [...new FormData(form).entries()],
      }));
      expectSame(result);
      expect(result.custom.values).toEqual(["apple", "banana", "durian", "Elderberry", "fig"]);
    });

    test("script changes: value, selectedIndex, and option.selected", async ({ page }) => {
      await mount(page, PAGE(attrs), MODULES);
      for (const step of [
        (el) => (el.value = "fig"),
        (el) => (el.value = "nope"),
        (el) => (el.selectedIndex = 0),
        (el) => (el.selectedIndex = -1),
        (el) => (el.options[3].selected = true),
      ]) {
        const result = await page.evaluate(
          ([source, stateSource]) => {
            const run = new Function("el", `(${source})(el);`);
            const read = new Function("el", "form", `return (${stateSource})(el, form);`);
            const out = {};
            for (const id of ["native", "custom"]) {
              const el = document.getElementById(id);
              run(el);
              out[id] = read(el, document.getElementById(`f-${id}`));
            }
            return out;
          },
          [step.toString(), state.toString()],
        );
        expectSame(result);
      }
    });

    test("form reset restores the default selection", async ({ page }) => {
      await mount(page, PAGE(attrs), MODULES);
      await both(page, (el) => (el.value = "fig"));
      await both(page, (el, form) => form.reset());
      const result = await page.evaluate((stateSource) => {
        const read = new Function("el", "form", `return (${stateSource})(el, form);`);
        return Object.fromEntries(
          ["native", "custom"].map((id) => [id, read(document.getElementById(id), document.getElementById(`f-${id}`))]),
        );
      }, state.toString());
      expectSame(result);
      expect(result.custom.value).toBe("banana");
    });

    test("required: invalid with nothing selected, valid once something is", async ({ page }) => {
      await mount(page, PAGE(`${attrs} required`), MODULES);
      const result = await both(page, (el) => {
        el.selectedIndex = -1;
        const empty = { valid: el.checkValidity(), valueMissing: el.validity.valueMissing, message: el.validationMessage };
        el.value = "apple";
        return { empty, filled: el.checkValidity() };
      });
      expectSame(result);
      expect(result.custom.empty.valid).toBe(false);
    });
  });
}

// Compared with a classic listbox: engines don't agree yet on base-select
// listbox keys (Chromium 153's arrows move focus without selecting; WebKit
// 26's select, like a classic one).
test("single: the keyboard selects like a native listbox", async ({ page }) => {
  await mount(page, PAGE("", { base: false }), MODULES);
  const sequence = {};
  for (const id of ["native", "custom"]) {
    await page.evaluate((id) => {
      window.events = [];
      const el = document.getElementById(id);
      for (const type of ["input", "change"]) el.addEventListener(type, () => window.events.push(type));
    }, id);
    // A base-select listbox puts focus on its options rather than on the
    // <select> itself, as the MDN guide notes; a classic one focuses the
    // <select>. Either way, start from the selected option.
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      el.focus();
      if (!el.contains(document.activeElement)) el.querySelector("option:checked")?.focus();
    }, id);
    const seen = [];
    for (const key of ["ArrowDown", "End", "Home", "e"]) {
      await page.keyboard.press(key);
      seen.push(await page.evaluate((id) => document.getElementById(id).value, id));
    }
    sequence[id] = { values: seen, events: await page.evaluate(() => window.events) };
  }
  expect(sequence.custom).toEqual(sequence.native);
  expect(sequence.custom.values, "disabled options are skipped").toEqual(["Elderberry", "fig", "apple", "Elderberry"]);
});

test("add(), remove(), and namedItem() edit the options like a native select", async ({ page }) => {
  await mount(page, PAGE(), MODULES);
  const result = await both(page, (el, form) => {
    const option = (text, attrs = {}) => Object.assign(document.createElement("option"), { textContent: text, ...attrs });
    el.add(option("Grape", { value: "grape", id: `grape-${el.id}` }));
    el.add(option("Apricot", { value: "apricot" }), 0);
    // (A top-level reference: given an option inside an <optgroup>,
    // Chromium's native add() throws, though the spec allows it.)
    el.add(option("Kiwi", { value: "kiwi", selected: true }), el.options[4]);
    el.remove(1);
    el.remove(99);
    let notFound = null;
    try {
      el.add(option("x"), document.body);
    } catch (error) {
      notFound = error.name;
    }
    const named = el.namedItem(`grape-${el.id}`)?.value ?? null;
    return {
      values: [...el.options].map((o) => o.value),
      value: el.value,
      form: [...new FormData(form).entries()],
      notFound,
      named,
      missing: el.namedItem("nope"),
    };
  });
  expect(result.custom).toEqual(result.native);
  expect(result.custom.values).toEqual(["apricot", "banana", "durian", "kiwi", "Elderberry", "fig", "grape"]);
  const removedSelf = await page.evaluate(() => {
    document.getElementById("custom").remove();
    return document.getElementById("custom");
  });
  expect(removedSelf, "remove() with no index removes the element, as on a native select").toBe(null);
});
