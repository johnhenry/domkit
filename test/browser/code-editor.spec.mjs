import { test, expect } from "@playwright/test";
import { axNames, mount, recordEvents } from "./helpers.mjs";

const MODULES = ["src/code-editor/global.mjs"];
const UNDO = "ControlOrMeta+z";

const state = (page, id = "e") =>
  page.evaluate((id) => {
    const el = document.getElementById(id);
    return { value: el.value, start: el.selectionStart, end: el.selectionEnd };
  }, id);

// Put the caret (or a selection) at the given offsets, with focus.
const place = (page, start, end = start, id = "e") =>
  page.evaluate(
    ({ id, start, end }) => {
      const el = document.getElementById(id);
      el.focus();
      el.setSelectionRange(start, end);
    },
    { id, start, end },
  );

const tokens = (page, id = "e") =>
  page.evaluate((id) => document.getElementById(id).tokens().map(({ type, text }) => `${type}:${text}`), id);

test.describe("structure and accessibility", () => {
  test("upgrades its text into a labelled, multiline textarea, keeping the text", async ({ page, browserName }) => {
    await mount(page, `<label for="e">Code</label><code-editor id="e" language="js">\nconst a = 1;\n</code-editor>`, MODULES);
    const info = await page.evaluate(() => {
      const el = document.getElementById("e");
      const textarea = el.querySelector("textarea");
      const mirror = el.querySelector("pre");
      return {
        value: el.value,
        textarea: textarea === el.textarea,
        multiline: textarea.getAttribute("aria-multiline"),
        labelledby: document.getElementById(textarea.getAttribute("aria-labelledby"))?.textContent,
        mirrorHidden: mirror.getAttribute("aria-hidden"),
        mirrorText: mirror.textContent,
        form: textarea.form,
        name: textarea.name,
      };
    });
    expect(info).toEqual({
      value: "const a = 1;\n", // one leading newline dropped, like a textarea
      textarea: true,
      multiline: "true",
      labelledby: "Code",
      mirrorHidden: "true",
      mirrorText: "const a = 1;\n\n",
      form: null,
      name: "",
    });
    const names = await axNames(page, browserName, "textbox");
    if (names) expect(names).toContain("Code");
  });

  test("takes its initial text from a <pre>/<code> (and its language-* class) or an authored <textarea>", async ({ page }) => {
    await mount(
      page,
      `<code-editor id="a"><pre><code class="language-css">a { color: red }</code></pre></code-editor>
       <code-editor id="b" language="js"><textarea aria-label="Mine" name="ignored">let x;</textarea></code-editor>`,
      MODULES,
    );
    const info = await page.evaluate(() => {
      const a = document.getElementById("a");
      const b = document.getElementById("b");
      return {
        a: [a.value, a.resolvedLanguage, a.querySelectorAll("pre").length],
        b: [b.value, b.textarea.getAttribute("aria-label"), b.textarea.hasAttribute("name"), b.querySelectorAll("textarea").length],
      };
    });
    expect(info).toEqual({ a: ["a { color: red }", "css", 1], b: ["let x;", "Mine", false, 1] });
  });

  test("clicking the label focuses the textarea", async ({ page }) => {
    await mount(page, `<label for="e">Code</label><code-editor id="e"></code-editor>`, MODULES);
    await page.getByText("Code").click();
    await expect(page.locator("#e textarea")).toBeFocused();
  });

  test("the mirror lines up with the textarea and grows with the content", async ({ page }) => {
    // rows="1": start from a single line so growth is measurable (the default minimum is 2, like a textarea).
    await mount(page, `<code-editor id="e" language="js" rows="1">a</code-editor>`, MODULES);
    const one = await page.evaluate(() => document.getElementById("e").getBoundingClientRect().height);
    await place(page, 1);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    const sizes = await page.evaluate(() => {
      const el = document.getElementById("e");
      const t = el.textarea.getBoundingClientRect();
      const m = el.querySelector("pre").getBoundingClientRect();
      return { height: el.getBoundingClientRect().height, same: [t.top === m.top, t.left === m.left, t.width === m.width, t.height === m.height] };
    });
    expect(sizes.same).toEqual([true, true, true, true]);
    expect(sizes.height).toBeGreaterThan(one * 2.5);
  });
});

test.describe("highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test/browser/fixture.html");
    test.skip(!(await page.evaluate(() => "highlights" in CSS)), "no CSS Custom Highlight API in this engine");
  });

  test("highlights with code-color's tokenizer and shared highlights, as you type", async ({ page }) => {
    await mount(page, `<code-editor id="e" language="js">let a</code-editor>`, MODULES);
    expect(await tokens(page)).toEqual(["keyword:let"]);
    await place(page, 5);
    await page.keyboard.type(" = true");
    await expect.poll(() => tokens(page)).toEqual(["keyword:let", "keyword:true"]);
    const shared = await page.evaluate(() => CSS.highlights.get("domkit-keyword").size);
    expect(shared).toBe(2);
    await page.evaluate(() => (document.getElementById("e").language = "css"));
    await expect.poll(() => tokens(page)).not.toContain("keyword:let");
  });

  test("ranges are released on removal and restored on a move", async ({ page }) => {
    await mount(page, `<code-editor id="e" language="js">const a</code-editor><div id="b"></div>`, MODULES);
    const sizes = await page.evaluate(async () => {
      const el = document.getElementById("e");
      const size = () => CSS.highlights.get("domkit-keyword").size;
      const before = size();
      document.getElementById("b").append(el); // a move
      await new Promise((r) => setTimeout(r));
      const moved = size();
      el.remove();
      return [before, moved, size()];
    });
    expect(sizes).toEqual([1, 1, 0]);
  });
});

test.describe("editing keys (each one undoable in one step)", () => {
  test("typing edits the value and fires input from the element, change on blur", async ({ page }) => {
    await mount(page, `<code-editor id="e">ab</code-editor><input id="after" aria-label="after" />`, MODULES);
    const events = await recordEvents(page, ["input", "change"]);
    await place(page, 2);
    await page.keyboard.type("c");
    expect((await state(page)).value).toBe("abc");
    expect(await events.take()).toEqual([["input", "e"]]);
    const inputType = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document.getElementById("e").addEventListener("input", (e) => resolve(e.inputType), { once: true });
          document.execCommand("insertText", false, "d");
        }),
    );
    expect(inputType).toBe("insertText");
    await events.take();
    await page.locator("#after").focus();
    expect(await events.take()).toEqual([["change", "e"]]);
    // Script changes fire nothing.
    await page.evaluate(() => (document.getElementById("e").value = "x"));
    expect(await events.take()).toEqual([]);
  });

  // Each edit starts from a value set by script, which (as for a textarea)
  // clears the undo history: WebKit merges consecutive edits into one undo
  // step, as it does for its own typing.
  const reset = (page, value) =>
    page.evaluate((value) => {
      const el = document.getElementById("e");
      el.value = "";
      el.value = value;
    }, value);

  test("Tab inserts spaces to the next tab stop; Shift+Tab outdents the line", async ({ page }) => {
    await mount(page, `<code-editor id="e">a\nbc</code-editor>`, MODULES);
    await place(page, 1);
    await page.keyboard.press("Tab");
    expect(await state(page)).toEqual({ value: "a \nbc", start: 2, end: 2 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("a\nbc");
    await place(page, 2);
    await page.keyboard.press("Tab");
    expect(await state(page)).toEqual({ value: "a\n  bc", start: 4, end: 4 });
    await reset(page, "a\n  bc");
    await place(page, 4);
    await page.keyboard.press("Shift+Tab");
    expect(await state(page)).toEqual({ value: "a\nbc", start: 2, end: 2 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("a\n  bc");
  });

  test("Tab and Shift+Tab with a selection indent every selected line, keeping the selection", async ({ page }) => {
    await mount(page, `<code-editor id="e" tab-size="4">one\ntwo\n\nthree\nfour</code-editor>`, MODULES);
    await place(page, 1, 13); // "ne\ntwo\n\nthr"
    await page.keyboard.press("Tab");
    expect(await state(page)).toEqual({ value: "    one\n    two\n\n    three\nfour", start: 5, end: 25 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("one\ntwo\n\nthree\nfour");
    await reset(page, "    one\n    two\n\n    three\nfour");
    await place(page, 5, 25);
    await page.keyboard.press("Shift+Tab");
    expect(await state(page)).toEqual({ value: "one\ntwo\n\nthree\nfour", start: 1, end: 13 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("    one\n    two\n\n    three\nfour");
  });

  test("a selection ending at a line start doesn't indent that line", async ({ page }) => {
    await mount(page, `<code-editor id="e">a\nb\nc</code-editor>`, MODULES);
    await place(page, 0, 4); // "a\nb\n"
    await page.keyboard.press("Tab");
    expect(await state(page)).toEqual({ value: "  a\n  b\nc", start: 0, end: 8 });
  });

  test("Escape then Tab leaves the editor; Tab alone doesn't", async ({ page }) => {
    await mount(page, `<code-editor id="e">x</code-editor><input id="after" aria-label="after" />`, MODULES);
    await place(page, 1);
    await page.keyboard.press("Tab");
    await expect(page.locator("#e textarea")).toBeFocused();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    expect((await state(page)).value).toBe("x ");
    // Escape then Shift+Tab goes backwards; the escape is forgotten after another key.
    await place(page, 0);
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Tab");
    await expect(page.locator("#e textarea")).toBeFocused();
  });

  test("Enter keeps indentation, indents after an opener, and splits a bracket pair", async ({ page }) => {
    await mount(page, `<code-editor id="e">  a\n  f() {}</code-editor>`, MODULES);
    await place(page, 3);
    await page.keyboard.press("Enter");
    expect(await state(page)).toEqual({ value: "  a\n  \n  f() {}", start: 6, end: 6 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("  a\n  f() {}");
    await place(page, 11); // between { and }
    await page.keyboard.press("Enter");
    expect(await state(page)).toEqual({ value: "  a\n  f() {\n    \n  }", start: 16, end: 16 });
    await page.keyboard.press(UNDO);
    expect(await state(page)).toMatchObject({ value: "  a\n  f() {}" });
    await page.evaluate(() => (document.getElementById("e").value = "x = [  "));
    await place(page, 7);
    await page.keyboard.press("Enter");
    expect(await state(page)).toEqual({ value: "x = [  \n  ", start: 10, end: 10 });
  });

  test("brackets and quotes auto-close, type over, wrap a selection, and delete as a pair", async ({ page }) => {
    await mount(page, `<code-editor id="e"></code-editor>`, MODULES);
    await place(page, 0);
    await page.keyboard.type("f(");
    expect(await state(page)).toEqual({ value: "f()", start: 2, end: 2 });
    await page.keyboard.type("[");
    await page.keyboard.type("{");
    expect(await state(page)).toEqual({ value: "f([{}])", start: 4, end: 4 });
    await page.keyboard.type('"');
    await page.keyboard.type("`");
    expect(await state(page)).toEqual({ value: 'f([{"``"}])', start: 6, end: 6 });
    await page.keyboard.type("x`\"}])");
    expect(await state(page)).toEqual({ value: 'f([{"`x`"}])', start: 12, end: 12 });
    // Undo removes the last auto-closed pair as one step.
    await page.evaluate(() => (document.getElementById("e").value = ""));
    await place(page, 0);
    await page.keyboard.type("(");
    expect((await state(page)).value).toBe("()");
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("");
    // Backspace inside an empty pair deletes both; undo restores both.
    await page.evaluate(() => (document.getElementById("e").value = "a[]"));
    await place(page, 2);
    await page.keyboard.press("Backspace");
    expect(await state(page)).toEqual({ value: "a", start: 1, end: 1 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("a[]");
    // A selection is wrapped, and stays selected.
    await page.evaluate(() => (document.getElementById("e").value = "a b"));
    await place(page, 2, 3);
    await page.keyboard.type("'");
    expect(await state(page)).toEqual({ value: "a 'b'", start: 3, end: 4 });
  });

  test("no closing quote after a word character, or a bracket before one", async ({ page }) => {
    await mount(page, `<code-editor id="e">don\nx</code-editor>`, MODULES);
    await place(page, 3);
    await page.keyboard.type("'");
    expect((await state(page)).value).toBe("don'\nx");
    await place(page, 5);
    await page.keyboard.type("(");
    expect((await state(page)).value).toBe("don'\n(x");
  });

  test("no-auto-close turns pairs off", async ({ page }) => {
    await mount(page, `<code-editor id="e" no-auto-close>a)</code-editor>`, MODULES);
    await place(page, 1);
    await page.keyboard.type("(\")");
    expect((await state(page)).value).toBe('a("))');
    expect(await page.evaluate(() => document.getElementById("e").noAutoClose)).toBe(true);
  });

  test("a closing bracket typed on a blank indented line outdents it; Backspace deletes an indent level", async ({ page }) => {
    await mount(page, `<code-editor id="e">{\n    </code-editor>`, MODULES);
    await place(page, 6);
    await page.keyboard.press("Backspace");
    expect(await state(page)).toEqual({ value: "{\n  ", start: 4, end: 4 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("{\n    ");
    await place(page, 6);
    await page.keyboard.type("}");
    expect(await state(page)).toEqual({ value: "{\n  }", start: 5, end: 5 });
    await page.keyboard.press(UNDO);
    expect((await state(page)).value).toBe("{\n    ");
  });

  test("keydown reaches the element, uncanceled, for shortcuts it doesn't use", async ({ page }) => {
    await mount(page, `<code-editor id="e">run()</code-editor>`, MODULES);
    await page.evaluate(() => {
      window.seen = [];
      document.getElementById("e").addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          window.seen.push(event.defaultPrevented);
          event.preventDefault();
        }
      });
    });
    await place(page, 5);
    await page.keyboard.press("ControlOrMeta+Enter");
    expect(await page.evaluate(() => window.seen)).toEqual([false]);
    expect((await state(page)).value).toBe("run()");
  });

  test("a capture listener that prevents a key overrides the editor's handling", async ({ page }) => {
    await mount(page, `<code-editor id="e">a</code-editor><input id="after" aria-label="after" />`, MODULES);
    await page.evaluate(() =>
      document.getElementById("e").addEventListener("keydown", (event) => event.key === "(" && event.preventDefault(), { capture: true }),
    );
    await place(page, 1);
    await page.keyboard.type("(");
    expect((await state(page)).value).toBe("a");
  });

  test("selection API, select(), and setRangeText() work like a textarea's", async ({ page }) => {
    await mount(page, `<code-editor id="e">hello world</code-editor>`, MODULES);
    const result = await page.evaluate(() => {
      const el = document.getElementById("e");
      el.setSelectionRange(6, 11, "backward");
      const a = [el.selectionStart, el.selectionEnd, el.selectionDirection];
      el.setRangeText("there");
      const b = el.value;
      el.select();
      return { a, b, all: [el.selectionStart, el.selectionEnd], textLength: el.textLength, type: el.type };
    });
    expect(result).toEqual({ a: [6, 11, "backward"], b: "hello there", all: [0, 11], textLength: 11, type: "textarea" });
  });
});

test.describe("forms", () => {
  test("submits its value, resets to its default, and respects the dirty flag", async ({ page }) => {
    await mount(
      page,
      `<form id="f"><code-editor id="e" name="code">a</code-editor><code-editor id="v" name="other" value="dflt">ignored</code-editor></form>`,
      MODULES,
    );
    await place(page, 1);
    await page.keyboard.type("b");
    const result = await page.evaluate(() => {
      const form = document.getElementById("f");
      const e = document.getElementById("e");
      const v = document.getElementById("v");
      const data = [...new FormData(form)];
      v.setAttribute("value", "new default"); // not dirty: follows
      const followed = v.value;
      v.value = "typed";
      v.setAttribute("value", "newer"); // dirty: stays
      const kept = v.value;
      form.reset();
      return { data, followed, kept, reset: [e.value, v.value, v.defaultValue], elements: [...form.elements].map((x) => x.localName) };
    });
    expect(result).toEqual({
      data: [["code", "ab"], ["other", "dflt"]],
      followed: "new default",
      kept: "typed",
      reset: ["a", "newer", "newer"],
      elements: ["code-editor", "code-editor"],
    });
  });

  test("required: invalid while empty; disabled: not submitted, not focusable, no editing", async ({ page }) => {
    await mount(
      page,
      `<button id="before">b</button><form id="f"><code-editor id="e" name="code" required></code-editor></form><input id="after" aria-label="after" />`,
      MODULES,
    );
    const validity = await page.evaluate(() => {
      const e = document.getElementById("e");
      const before = [e.validity.valueMissing, e.matches(":invalid"), e.validationMessage.length > 0];
      e.value = "x";
      return [...before, e.validity.valid];
    });
    expect(validity).toEqual([true, true, true, true]);
    await page.evaluate(() => (document.getElementById("e").disabled = true));
    expect(await page.evaluate(() => [...new FormData(document.getElementById("f"))])).toEqual([]);
    expect(await page.evaluate(() => document.getElementById("e").matches(":disabled"))).toBe(true);
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    // A disabled fieldset disables it too.
    await page.evaluate(() => {
      const e = document.getElementById("e");
      e.disabled = false;
      const fieldset = document.createElement("fieldset");
      fieldset.disabled = true;
      e.before(fieldset);
      fieldset.append(e);
    });
    expect(await page.evaluate(() => [document.getElementById("e").matches(":disabled"), document.getElementById("e").textarea.disabled])).toEqual([true, true]);
  });

  test("readonly: selectable but not editable, and Tab moves on", async ({ page }) => {
    await mount(page, `<code-editor id="e" readonly>abc</code-editor><input id="after" aria-label="after" />`, MODULES);
    const events = await recordEvents(page, ["input"]);
    await place(page, 3);
    await page.keyboard.type("x(");
    await page.keyboard.press("Enter");
    expect((await state(page)).value).toBe("abc");
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    expect(await events.take()).toEqual([]);
    expect(await page.evaluate(() => document.getElementById("e").readOnly)).toBe(true);
  });
});

test.describe("attributes and lifecycle", () => {
  test("attributes reflect to properties and take effect when changed", async ({ page }) => {
    await mount(page, `<code-editor id="e">x</code-editor>`, MODULES);
    const result = await page.evaluate(() => {
      const el = document.getElementById("e");
      const textarea = el.textarea;
      const defaults = [el.tabSize, el.rows, el.wrap, el.language, el.resolvedLanguage, textarea.style.whiteSpace];
      el.tabSize = 4;
      el.rows = 3;
      el.wrap = "off";
      el.placeholder = "Type";
      el.name = "n";
      el.language = "ts";
      return {
        defaults,
        attrs: ["tab-size", "rows", "wrap", "placeholder", "name", "language"].map((a) => el.getAttribute(a)),
        effects: [
          textarea.style.whiteSpace,
          el.querySelector("pre").style.whiteSpace,
          textarea.style.tabSize,
          el.style.getPropertyValue("--domkit-code-editor-rows"),
          textarea.placeholder,
          el.resolvedLanguage,
        ],
      };
    });
    expect(result).toEqual({
      // Like a textarea: 2 rows, and wrap reflects the (absent) attribute while long lines wrap.
      defaults: [2, 2, "", "", "html", "pre-wrap"],
      attrs: ["4", "3", "off", "Type", "n", "ts"],
      effects: ["pre", "pre", "4", "3", "Type", "js"],
    });
  });

  test("rows sets a minimum height (2 by default, like a textarea); max-height makes it scroll and follow the caret", async ({ page }) => {
    await mount(page, `<code-editor id="e" style="display: block; line-height: 20px; max-height: 100px; overflow: auto"></code-editor>`, MODULES);
    const two = await page.evaluate(() => document.getElementById("e").getBoundingClientRect().height);
    await page.evaluate(() => (document.getElementById("e").rows = 1));
    const one = await page.evaluate(() => document.getElementById("e").getBoundingClientRect().height);
    expect(two - one).toBeCloseTo(20, 0);
    await page.evaluate(() => (document.getElementById("e").rows = 3));
    const three = await page.evaluate(() => document.getElementById("e").getBoundingClientRect().height);
    expect(three - one).toBeCloseTo(40, 0);
    await place(page, 0);
    for (let i = 0; i < 12; i++) await page.keyboard.press("Enter");
    const scroll = await page.evaluate(() => {
      const el = document.getElementById("e");
      return { height: el.getBoundingClientRect().height, top: el.scrollTop };
    });
    expect(scroll.height).toBeLessThanOrEqual(101);
    expect(scroll.top).toBeGreaterThan(150);
    expect(await page.evaluate(() => document.getElementById("e").textarea.scrollTop)).toBe(0);
    for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowUp");
    // Following the caret happens after the selection changes (asynchronously
    // in some engines): wait for it rather than reading it immediately.
    await expect.poll(() => page.evaluate(() => document.getElementById("e").scrollTop)).toBe(0);
  });

  test("back on the first line it scrolls all the way to the top, even with fractional line boxes", async ({ page }) => {
    // Regression: caret-follow revealed the line's sub-pixel box, which left
    // Linux Chromium 1px short of the top. A textarea scrolls to its edge.
    await mount(page, `<code-editor id="e" rows="1" style="display: block; line-height: 20.37px; padding: 3.3px 5px; max-height: 61.7px; overflow: auto"></code-editor>`, MODULES);
    await place(page, 0);
    for (let i = 0; i < 9; i++) await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.getElementById("e").scrollTop)).toBeGreaterThan(50);
    for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowUp");
    await expect.poll(() => page.evaluate(() => document.getElementById("e").scrollTop)).toBe(0);
    for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => { const el = document.getElementById("e"); return el.scrollHeight - el.clientHeight - el.scrollTop; })).toBeLessThanOrEqual(0.5);
  });

  test("long lines wrap by default; wrap=off scrolls them sideways, following the caret", async ({ page }) => {
    await mount(page, `<code-editor id="d" style="display: block; width: 200px; overflow: auto"></code-editor>`, MODULES);
    await page.evaluate(() => (document.getElementById("d").value = "x".repeat(80)));
    expect(await page.evaluate(() => {
      const el = document.getElementById("d");
      return { wide: el.scrollWidth > el.clientWidth, tall: el.getBoundingClientRect().height > 60 };
    })).toEqual({ wide: false, tall: true });
    await mount(page, `<code-editor id="e" wrap="off" style="display: block; width: 200px; overflow: auto"></code-editor>`, MODULES);
    await place(page, 0);
    await page.keyboard.type("x".repeat(80));
    const unwrapped = await page.evaluate(() => {
      const el = document.getElementById("e");
      return { left: el.scrollLeft, wide: el.scrollWidth > el.clientWidth, textareaLeft: el.textarea.scrollLeft };
    });
    expect(unwrapped.wide).toBe(true);
    expect(unwrapped.left).toBeGreaterThan(0);
    expect(unwrapped.textareaLeft).toBe(0);
    const wrapped = await page.evaluate(() => {
      const el = document.getElementById("e");
      el.wrap = "soft";
      return { wide: el.scrollWidth > el.clientWidth, tall: el.getBoundingClientRect().height > 40 };
    });
    expect(wrapped).toEqual({ wide: false, tall: true });
  });

  test("maxlength and minlength behave like a textarea's: typing stops, and only user edits are tooLong/tooShort", async ({ page }) => {
    await mount(page, `<code-editor id="e" maxlength="5" minlength="3"></code-editor>`, MODULES);
    const scripted = await page.evaluate(() => {
      const el = document.getElementById("e");
      el.value = "abcdefgh"; // script may exceed maxlength, and isn't flagged
      return { tooLong: el.validity.tooLong, maxLength: el.maxLength, minLength: el.minLength, inner: el.textarea.maxLength };
    });
    expect(scripted).toEqual({ tooLong: false, maxLength: 5, minLength: 3, inner: 5 });
    await page.evaluate(() => (document.getElementById("e").value = ""));
    await place(page, 0);
    await page.keyboard.type("abcdefgh");
    expect(await page.evaluate(() => document.getElementById("e").value)).toBe("abcde");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    const short = await page.evaluate(() => {
      const el = document.getElementById("e");
      return { value: el.value, tooShort: el.validity.tooShort, valid: el.checkValidity() };
    });
    expect(short).toEqual({ value: "a", tooShort: true, valid: false });
    const absent = await page.evaluate(() => {
      const el = document.createElement("code-editor");
      return [el.maxLength, el.minLength];
    });
    expect(absent).toEqual([-1, -1]);
  });

  test("text-entry attributes: code defaults are off, and author values pass through", async ({ page }) => {
    await mount(page, `<code-editor id="a"></code-editor><code-editor id="b" spellcheck="true" autocapitalize="sentences" inputmode="numeric" enterkeyhint="done"></code-editor>`, MODULES);
    const attrs = await page.evaluate(() =>
      ["a", "b"].map((id) => {
        const t = document.getElementById(id).textarea;
        return ["spellcheck", "autocapitalize", "autocorrect", "autocomplete", "inputmode", "enterkeyhint"].map((n) => t.getAttribute(n));
      }),
    );
    expect(attrs).toEqual([
      ["false", "off", "off", "off", null, null],
      ["true", "sentences", "off", "off", "numeric", "done"],
    ]);
  });

  test("autofocus focuses the editor when nothing else has focus", async ({ page }) => {
    await mount(page, `<code-editor id="e" autofocus>x</code-editor>`, MODULES);
    await page.waitForFunction(() => document.activeElement === document.getElementById("e").textarea);
  });

  test("the placeholder shows while empty", async ({ page }) => {
    await mount(page, `<code-editor id="e" placeholder="Type code"></code-editor>`, MODULES);
    const shown = await page.evaluate(() => {
      const t = document.getElementById("e").textarea;
      return [t.placeholder, getComputedStyle(t).webkitTextFillColor !== "rgba(0, 0, 0, 0)"];
    });
    expect(shown).toEqual(["Type code", true]);
    await place(page, 0);
    await page.keyboard.type("a");
    expect(await page.evaluate(() => getComputedStyle(document.getElementById("e").textarea).webkitTextFillColor)).toBe("rgba(0, 0, 0, 0)");
  });

  test("works however it's created: script value before connect, and a move keeps everything", async ({ page }) => {
    await mount(page, `<form id="f"></form><div id="b"></div>`, MODULES);
    const result = await page.evaluate(async () => {
      const el = document.createElement("code-editor");
      el.setAttribute("name", "c");
      el.value = "set early";
      el.language = "js";
      document.getElementById("f").append(el);
      const first = [el.value, el.textarea.value];
      document.getElementById("b").append(el);
      document.getElementById("f").append(el);
      await new Promise((r) => setTimeout(r));
      return { first, after: el.value, textareas: el.querySelectorAll("textarea").length, data: [...new FormData(document.getElementById("f"))] };
    });
    expect(result).toEqual({ first: ["set early", "set early"], after: "set early", textareas: 1, data: [["c", "set early"]] });
  });

  test("hundreds of instances are cheap to create", async ({ page }) => {
    await mount(page, `<div id="host"></div>`, MODULES);
    const ms = await page.evaluate(async () => {
      const source = "function f(a, b) {\n  return a + b; // sum\n}\n".repeat(5);
      const start = performance.now();
      const host = document.getElementById("host");
      for (let i = 0; i < 300; i++) {
        const el = document.createElement("code-editor");
        el.language = "js";
        el.value = source;
        host.append(el);
      }
      await new Promise((r) => requestAnimationFrame(() => r()));
      return performance.now() - start;
    });
    expect(ms).toBeLessThan(3000);
  });
});
