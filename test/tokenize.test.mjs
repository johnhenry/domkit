// code-color's tokenizer is pure: test it directly (the element itself,
// which needs the CSS Custom Highlight API, is in test/browser/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { languageOf, tokenize } from "../src/code-color/tokenize.mjs";

const spans = (source, language) => tokenize(source, language).map(([type, s, e]) => `${type}:${source.slice(s, e)}`);

test("language names and aliases", () => {
  assert.equal(languageOf("javascript"), "js");
  assert.equal(languageOf("language-ts"), "js");
  assert.equal(languageOf("JSON"), "js");
  assert.equal(languageOf("svg"), "html");
  assert.equal(languageOf("scss"), "css");
  assert.equal(languageOf("cobol"), null);
});

test("JavaScript: keywords, strings, templates, comments, numbers, calls, properties, JSON keys", () => {
  assert.deepEqual(spans("const s = `a ${b}`; /* c */ x.y.z(0x1F, 1e3, .5n)", "js"), [
    "keyword:const",
    "string:`a ${b}`",
    "comment:/* c */",
    "property:y",
    "function:z",
    "number:0x1F",
    "number:1e3",
    "number:.5n",
  ]);
  assert.deepEqual(spans('{"a": "b", "c": [true]}', "js"), ['property:"a"', 'string:"b"', 'property:"c"', "keyword:true"]);
  assert.deepEqual(spans("item2 x1", "js"), [], "digits inside identifiers aren't numbers");
});

test("CSS: at-rule preludes, selectors, declarations, values, nesting", () => {
  assert.deepEqual(spans("@media (width > 600px) { .a:hover > b[x] { color: #abc !important; width: calc(1px + 2%) } }", "css"), [
    "keyword:@media",
    "number:600px",
    "attribute:.a",
    "keyword::hover",
    "tag:b",
    "attribute:[x]",
    "property:color",
    "number:#abc",
    "keyword:!important",
    "property:width",
    "function:calc",
    "number:1px",
    "number:2%",
  ]);
  assert.deepEqual(spans(".card { padding: 1em; &:hover { color: red } }", "css"), [
    "attribute:.card",
    "property:padding",
    "number:1em",
    "keyword::hover",
    "property:color",
  ]);
});

test("HTML: doctype, comments, tags, attributes, unquoted values, embedded CSS/JS", () => {
  assert.deepEqual(spans('<!DOCTYPE html><!-- x --><a href=/y data-z="1">t</a>', "html"), [
    "keyword:<!DOCTYPE html>",
    "comment:<!-- x -->",
    "tag:<a",
    "attribute:href",
    "string:/y",
    "attribute:data-z",
    'string:"1"',
    "tag:>",
    "tag:</a",
    "tag:>",
  ]);
  assert.deepEqual(spans("<style>p{margin:0}</style>", "html"), ["tag:<style", "tag:>", "tag:p", "property:margin", "number:0", "tag:</style", "tag:>"]);
});

test("never throws on unterminated input", () => {
  for (const language of ["js", "css", "html"]) {
    for (const source of ['"open', "/* open", "`open", "<a b='open", "<!-- open", "@media (", "a { color:"]) {
      assert.doesNotThrow(() => tokenize(source, language), `${language}: ${source}`);
    }
  }
});
