// definable's loaders and the deprecated shadow-dom alias. (The rebuilt
// elements are covered in test/browser/.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

await import("../src/definable/define-component/global.mjs");
await import("../src/definable/polyfill-window/global.mjs");
const definetag = (await import("../src/definable/definetag/index.mjs")).default;
const untilWindowLoad = (await import("../src/definable/until-window-load/index.mjs"))
  .default;

const moduleURL = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`;

test("define-component imports a module and registers its export", async () => {
  const src = moduleURL(
    `export default class extends HTMLElement { connectedCallback() { this.textContent = "loaded"; } }`,
  );
  render(`<define-component name="x-loaded" src="${src}"></define-component><x-loaded></x-loaded>`);
  await customElements.whenDefined("x-loaded");
  await tick();
  assert.equal(document.querySelector("x-loaded").textContent, "loaded");
});

test("define-component's force warns instead of throwing on a taken name", async () => {
  const warnings = [];
  const warn = console.warn;
  console.warn = (message) => warnings.push(message);
  try {
    render(`<define-component name="x-loaded" src="${moduleURL("export default class extends HTMLElement {}")}" force></define-component>`);
    await tick();
  } finally {
    console.warn = warn;
  }
  assert.equal(warnings.length, 1);
});

test("polyfill-window assigns a module's export to a global", async () => {
  render(`<polyfill-window name="answer" src="${moduleURL("export default 42;")}"></polyfill-window>`);
  for (let i = 0; i < 50 && globalThis.answer === undefined; i++) await tick(5);
  assert.equal(globalThis.answer, 42);
});

test("definetag curries customElements.define", () => {
  class Tagged extends HTMLElement {}
  definetag(Tagged)("x-tagged");
  assert.equal(customElements.get("x-tagged"), Tagged);
});

test("until-window-load strips its class immediately once the page has loaded", async () => {
  render(`<p class="pending keep"></p>`);
  if (document.readyState !== "complete") {
    await new Promise((r) => window.addEventListener("load", r, { once: true }));
  }
  untilWindowLoad("pending");
  assert.equal(document.querySelector("p").className, "keep");
});

test("shadow-dom wraps its children in an open shadow root with one slot", async () => {
  const ShadowDom = (await import("../src/shadow-dom/index.mjs")).default;
  customElements.define("shadow-dom", ShadowDom);
  render(`<shadow-dom><b>hi</b></shadow-dom>`);
  const el = document.querySelector("shadow-dom");
  assert.equal(el.shadowRoot.mode, "open");
  assert.equal(el.shadowRoot.querySelectorAll("slot").length, 1);
});
