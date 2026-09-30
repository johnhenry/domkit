// Resolves `src` relative to the current document's directory (the
// current location's URL with any query string and filename stripped) --
// shared by define-component and polyfill-window,
// which both load a module by URL relative to the page that references
// them. Was previously two copy-pasted copies of the same logic; kept as
// one so a fix to the resolution logic can't drift between them.
export function resolveRelativeUrl(src) {
  const { href } = globalThis.location;
  const indexQM = href.lastIndexOf("?");
  const withoutQuery = indexQM === -1 ? href : href.substring(0, indexQM);
  const indexS = withoutQuery.lastIndexOf("/");
  const dirname =
    indexS === -1 ? withoutQuery : withoutQuery.substring(0, indexS);
  return new URL(src, dirname + "/");
}
