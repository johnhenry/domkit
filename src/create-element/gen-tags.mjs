import HTMLtags from "./html-tags.mjs";
import SVGtags from "./svg-tags.mjs";
const uppercaseList = ["switch", "var"];
const upCaseIfNecessary =
  (...list) =>
  (tag) => {
    if (list.includes(tag)) {
      return tag.charAt(0).toUpperCase() + tag.slice(1);
    }
    return tag;
  };
const upcase = upCaseIfNecessary(...uppercaseList);
const preamble = (file, lines = []) => {
  Deno.writeTextFileSync(file, lines.join("\n") + "\n", {});
};
const content = (file, tags = []) => {
  for (const tag of tags) {
    Deno.writeTextFileSync(
      file,
      `export const ${upcase(tag).replaceAll(
        "-",
        "_"
      )} = (a, ...c) => t("${tag}", a, ...c);` + "\n",
      { append: true }
    );
  }
};
preamble("./tags/html.mjs", [`import t from "../index.mjs";`]);
preamble("./tags/svg.mjs", [
  `import s from "../index.mjs";`,
  `const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';`,
  "const t = s(SVG_NAMESPACE);",
]);
content("./tags/html.mjs", HTMLtags);
content("./tags/svg.mjs", SVGtags);
Deno.writeTextFileSync("./LAST_GEN", Number(new Date()));
