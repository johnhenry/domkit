// Turns custom-elements.json (from `cem analyze`) into:
//   - vscode.html-custom-data.json: tag/attribute autocomplete and hover
//     docs in VS Code's HTML editor (and other editors that read the
//     format). Add it to the `html.customData` setting.
//   - src/<module>/index.d.mts: a TypeScript declaration for each element
//     class, plus a global HTMLElementTagNameMap entry, so
//     `document.querySelector("tabbed-ui")` is typed.
//   - src/<module>/global.d.mts: lets `import ".../global.mjs"` bring in
//     those types too.
// Every output is generated, committed, and checked for drift in CI; edit
// the JSDoc in the element's index.mjs instead.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "https://github.com/johnhenry/domkit/tree/main";
const GENERATED = "// Generated from custom-elements.json by scripts/manifest-outputs.mjs.\n// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.\n";
const VALID_TAG = /^[a-z][a-z0-9]*-[a-z0-9-]*$/;

const manifest = JSON.parse(await readFile(join(ROOT, "custom-elements.json"), "utf8"));
// The analyzer emits modules in file-system order, which varies between
// runs; sort so the committed manifest is reproducible (CI checks drift).
manifest.modules.sort((a, b) => a.path.localeCompare(b.path));
await writeFile(join(ROOT, "custom-elements.json"), JSON.stringify(manifest, null, 2) + "\n");

const elements = manifest.modules.flatMap((mod) =>
  (mod.declarations ?? [])
    .filter((d) => d.customElement && VALID_TAG.test(d.tagName ?? ""))
    .map((declaration) => ({ path: mod.path, declaration })),
);

const doc = (text, indent = "") =>
  text ? `${indent}/** ${text.replace(/\*\//g, "*\\/").replace(/\n/g, `\n${indent} * `)} */\n` : "";

// --- VS Code custom data -------------------------------------------------
const customData = {
  version: 1.1,
  tags: elements.map(({ path, declaration: d }) => ({
    name: d.tagName,
    description: [d.summary ?? d.description, d.events?.length ? `Events: ${d.events.map((e) => `\`${e.name}\``).join(", ")}` : ""]
      .filter(Boolean)
      .join("\n\n"),
    attributes: (d.attributes ?? []).map((a) => ({
      name: a.name,
      description: a.description,
      ...(a.type?.text === "boolean" ? { valueSet: "v" } : {}),
    })),
    references: [{ name: "Documentation", url: `${REPO}/${dirname(path)}` }],
  })),
};
await writeFile(join(ROOT, "vscode.html-custom-data.json"), JSON.stringify(customData, null, 2) + "\n");

// --- TypeScript declarations ---------------------------------------------
const tsType = (text) => (text ? text.replace(/\bobject\b/g, "Record<string, unknown>") : "unknown");

for (const { path, declaration: d } of elements) {
  const className = d.name && d.name !== "default" ? d.name : "Element";
  const members = (d.members ?? []).filter((m) => (m.privacy ?? "public") === "public" && !m.static);
  const body = members
    .map((m) => {
      if (m.kind === "method") {
        const params = (m.parameters ?? [])
          .map((p) => `${p.name}${p.optional || p.default !== undefined ? "?" : ""}: ${tsType(p.type?.text)}`)
          .join(", ");
        return `${doc(m.description, "  ")}  ${m.name}(${params}): ${tsType(m.return?.type?.text ?? "void")};`;
      }
      return `${doc(m.description, "  ")}  ${m.readonly ? "readonly " : ""}${m.name}: ${tsType(m.type?.text)};`;
    })
    .join("\n");
  const dts =
    GENERATED +
    "\n" +
    doc(d.description ?? d.summary) +
    `export default class ${className} extends HTMLElement {\n${body}\n}\n\n` +
    `declare global {\n  interface HTMLElementTagNameMap {\n    "${d.tagName}": ${className};\n  }\n}\n`;
  await writeFile(join(ROOT, path.replace(/\.mjs$/, ".d.mts")), dts);
  await writeFile(
    join(ROOT, dirname(path), "global.d.mts"),
    `${GENERATED}// Registers <${d.tagName}>; see ./index.d.mts for its type.\nimport "./index.mjs";\nexport {};\n`,
  );
}

console.log(
  `✅ ${elements.length} element(s): ${elements.map((e) => e.declaration.tagName).join(", ")} -> vscode.html-custom-data.json, ${elements
    .map((e) => relative(ROOT, join(ROOT, e.path.replace(/\.mjs$/, ".d.mts"))))
    .join(", ")}`,
);
