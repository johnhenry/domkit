// The remaining stable modules: menu-component, definable's loaders, and
// the deprecated shadow-dom alias. (hotkey-dialog and class-cycler are
// covered in test/browser/.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, tick } from "./dom.mjs";

await import("../src/menu-component/global.mjs");
await import("../src/definable/define-component/global.mjs");
await import("../src/definable/polyfill-window/global.mjs");
const definetag = (await import("../src/definable/definetag/index.mjs")).default;
const untilWindowLoad = (await import("../src/definable/until-window-load/index.mjs"))
  .default;
const { attach, detach } = await import("../src/menu-component/hash.mjs");

const moduleURL = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`;

test("menu-component pushes a template screen, pops on its end event, and syncs the hash", async () => {
  render(`<menu-component id="menu">
    <div data-key="profile">Profile<template><button id="back">back</button></template></div>
    <div>Leaf</div>
  </menu-component>`);
  const menu = document.getElementById("menu");
  await tick();
  const events = [];
  for (const type of ["pushed", "popped"]) {
    menu.addEventListener(type, (e) => events.push([type, e.detail.pushed]));
  }
  attach(menu);
  menu.push("profile");
  await tick(20); // let the push's own hashchange round-trip settle
  assert.equal(menu.getAttribute("pushed"), "profile");
  assert.equal(location.hash, "#profile");
  const back = menu.shadowRoot.querySelector("#back");
  assert.ok(back, "template content is rendered in the shadow root");
  back.dispatchEvent(new Event("end", { bubbles: true }));
  await tick();
  assert.equal(menu.getAttribute("pushed"), null);
  assert.deepEqual(events, [["pushed", "profile"], ["popped", "profile"]]);
  detach(menu);
  assert.equal(window.onhashchange, null, "detach removes the handler it installed");
});

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
