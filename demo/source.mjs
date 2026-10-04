// Shows each card's source beside it: the file its iframe loads, exactly as
// written, highlighted by <code-color>. A checkbox in the header hides it
// again, and the choice is remembered.
import "../src/code-color/global.mjs";

const KEY = "domkit-demo-source";

for (const iframe of document.querySelectorAll(".card iframe")) {
  const name = new URL(iframe.src).pathname.replace(/^.*?\/(src|demo)\//, "$1/");
  const pane = document.createElement("div");
  pane.className = "source";
  const link = document.createElement("a");
  link.href = iframe.src;
  link.textContent = name;
  const source = document.createElement("code-color");
  source.language = "html";
  const pre = document.createElement("pre");
  pre.textContent = `Loading ${name}…`;
  source.append(pre);
  pane.append(link, source);
  iframe.after(pane);

  fetch(iframe.src)
    .then((response) => (response.ok ? response.text() : Promise.reject(new Error(response.statusText))))
    .then((text) => (pre.textContent = text.trimEnd()))
    .catch((error) => (pre.textContent = `Couldn't load ${name}: ${error.message}`));
  pre.setAttribute("aria-label", `Source of ${name}`);
  pre.tabIndex = 0;
}

const toggle = document.querySelector("#show-source");
if (toggle) {
  try {
    toggle.checked = localStorage.getItem(KEY) !== "hidden";
  } catch {}
  const apply = () => {
    document.documentElement.toggleAttribute("data-hide-source", !toggle.checked);
    try {
      localStorage.setItem(KEY, toggle.checked ? "shown" : "hidden");
    } catch {}
  };
  toggle.addEventListener("change", apply);
  apply();
}
