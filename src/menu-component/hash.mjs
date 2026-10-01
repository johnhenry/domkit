// Connect Menu (top-level) to Hash navigation
const registry = new WeakMap();

const attach = (menu = globalThis.document.getElementById("menu")) => {
  // composedPath()[0] is the element that dispatched the event -- only
  // react to this menu's own pushes/pops, not ones bubbling up from a
  // nested menu. (This used Chrome's non-standard `event.path`, which
  // Chrome removed in v109, so every push/pop threw instead.)
  const onPushed = (event) => {
    if (menu === event.composedPath()[0]) {
      globalThis.location.hash = event.detail.pushed;
    }
  };
  const onPopped = (event) => {
    if (menu === event.composedPath()[0]) {
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
  if (menu.kids?.size) {
    // Already rendered: sync from the current hash now. Waiting for the
    // first "reset" here meant that reset was the one fired by the first
    // *pop* -- which then re-pushed the very screen being closed.
    setHash({ newURL: globalThis.location.hash });
  } else {
    menu.addEventListener("reset", onReset, { once: true });
  }

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
