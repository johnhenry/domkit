// Connect Menu (top-level) to Hash navigation
const registry = new WeakMap();

const attach = (menu = globalThis.document.getElementById("menu")) => {
  const onPushed = ({ detail: { pushed }, path: [initiator] }) => {
    if (menu === initiator) {
      globalThis.location.hash = pushed;
    }
  };
  const onPopped = ({ path: [initiator] }) => {
    if (menu === initiator) {
      globalThis.location.hash = "";
    }
  };
  const setHash = (
    { oldURL, newURL } = { oldURL: undefined, newURL: undefined }
  ) => {
    if (oldURL === newURL) {
      return;
    }
    menu.push((globalThis.location.hash || "").split("#")[1] || null);
  };
  const onReset = () => setHash({ newURL: globalThis.location.hash });

  menu.addEventListener("pushed", onPushed);
  menu.addEventListener("popped", onPopped);
  globalThis.onhashchange = setHash;
  menu.addEventListener("reset", onReset, { once: true });

  registry.set(menu, { onPushed, onPopped, onReset, setHash });
};

// Reverses attach(menu): removes the three listeners it added, and clears
// globalThis.onhashchange only if it's still the handler attach() installed
// (so a different handler set up after attach() ran isn't clobbered).
const detach = (menu = globalThis.document.getElementById("menu")) => {
  const entry = registry.get(menu);
  if (!entry) {
    return;
  }
  const { onPushed, onPopped, onReset, setHash } = entry;
  menu.removeEventListener("pushed", onPushed);
  menu.removeEventListener("popped", onPopped);
  menu.removeEventListener("reset", onReset);
  if (globalThis.onhashchange === setHash) {
    globalThis.onhashchange = null;
  }
  registry.delete(menu);
};

export default attach;
export { attach, detach };
