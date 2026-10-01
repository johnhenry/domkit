// Shared helpers for the Playwright suites in this directory.

/**
 * Open the blank fixture page, import the given modules (paths relative to
 * the repo root, e.g. "src/tabbed-ui/global.mjs"), then set the body's HTML.
 * Modules load first, so elements upgrade as the markup is inserted -- the
 * same order as a page with module scripts in <head>.
 */
export async function mount(page, html, modules = []) {
  await page.goto("/test/browser/fixture.html");
  await page.evaluate(async ({ html, modules }) => {
    for (const path of modules) await import(`/${path}`);
    document.body.innerHTML = html;
  }, { html, modules });
}

/**
 * Record events of the given types (from anywhere in the page, captured at
 * the window) into window.__events as [type, target id] pairs.
 */
export async function recordEvents(page, types) {
  await page.evaluate((types) => {
    window.__events = [];
    for (const type of types) {
      window.addEventListener(type, (e) => window.__events.push([type, e.target.id]), true);
    }
  }, types);
  return {
    take: () => page.evaluate(() => window.__events.splice(0)),
  };
}
