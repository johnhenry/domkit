// A small, dependency-free tokenizer for syntax highlighting: one pass over
// plain text, returning [type, start, end] spans. Good enough for display,
// not a parser: it never fails, and unknown text is simply not colored.
//
// Types: comment, keyword, string, number, function, property, tag,
// attribute -- the names <code-color> exposes as ::highlight(domkit-<type>).

const JS_KEYWORDS = new Set(
  (
    "as async await break case catch class const continue debugger default delete do else export extends " +
    "false finally for from function get if import in instanceof let new null of return set static super " +
    "switch this throw true try typeof undefined var void while with yield NaN Infinity"
  ).split(" "),
);

const ALIASES = {
  js: "js", javascript: "js", mjs: "js", cjs: "js", jsx: "js", ts: "js", typescript: "js", tsx: "js", json: "js",
  css: "css", scss: "css", less: "css",
  html: "html", htm: "html", xml: "html", svg: "html", markup: "html", xhtml: "html",
};

/** Normalize a language name ("javascript", "language-ts", …) to js/css/html, or null. */
export const languageOf = (name) => ALIASES[String(name ?? "").toLowerCase().replace(/^language-/, "")] ?? null;

/**
 * @param {string} text
 * @param {"js" | "css" | "html"} language
 * @param {number} [offset] added to every span (for embedded code)
 * @returns {[string, number, number][]}
 */
export function tokenize(text, language, offset = 0) {
  const tokens = language === "js" ? js(text) : language === "css" ? css(text) : language === "html" ? html(text) : [];
  return offset ? tokens.map(([type, start, end]) => [type, start + offset, end + offset]) : tokens;
}

// Try each [type, sticky regex] at `i`; return [type, end] for the first match.
const scan = (text, i, rules) => {
  for (const [type, pattern] of rules) {
    pattern.lastIndex = i;
    const match = pattern.exec(text);
    if (match && match[0].length) return [type, i + match[0].length];
  }
  return null;
};

const STRING = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const NUMBER =
  /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/y;

function js(text) {
  const tokens = [];
  const rules = [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ["string", /`(?:\\[\s\S]|[^`\\])*`?/y],
    ["string", STRING],
    ["number", NUMBER],
  ];
  const IDENT = /[A-Za-z_$][\w$]*/y;
  let i = 0;
  while (i < text.length) {
    const previous = text[i - 1];
    const hit = /[\w$]/.test(previous ?? "") ? null : scan(text, i, rules);
    if (hit) {
      tokens.push([hit[0], i, hit[1]]);
      i = hit[1];
      continue;
    }
    IDENT.lastIndex = i;
    const ident = /[\w$]/.test(previous ?? "") ? null : IDENT.exec(text);
    if (ident) {
      const word = ident[0];
      const end = i + word.length;
      const before = text.slice(0, i).trimEnd();
      const after = text.slice(end).trimStart();
      // JSON-style "key": is handled as a string; `.name` is a property;
      // `name(` a function call or declaration; reserved words keywords.
      const type = before.endsWith(".") && !before.endsWith("..")
        ? after.startsWith("(") ? "function" : "property"
        : JS_KEYWORDS.has(word)
          ? "keyword"
          : after.startsWith("(")
            ? "function"
            : null;
      if (type) tokens.push([type, i, end]);
      i = end;
      continue;
    }
    i++;
  }
  // A string immediately followed by ":" in an object/JSON is a key.
  return tokens.map((token) =>
    token[0] === "string" && /^\s*:/.test(text.slice(token[2])) && /[{,]\s*$/.test(text.slice(0, token[1]))
      ? ["property", token[1], token[2]]
      : token,
  );
}

function css(text) {
  const tokens = [];
  const COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y;
  const IDENT = /-?[A-Za-z_][\w-]*/y;
  let i = 0;
  let mode = "selector"; // selector | declaration | value
  const push = (type, start, end) => tokens.push([type, start, end]);
  const atDeclarationStart = () => {
    // Is the text from here a declaration ("color: red;") or a nested
    // selector ("a:hover {")? Look for whichever of ; { } comes first.
    const rest = text.slice(i);
    const next = rest.search(/[;{}]/);
    return next < 0 || rest[next] !== "{";
  };
  while (i < text.length) {
    const c = text[i];
    const hit = scan(text, i, [["comment", COMMENT], ["string", STRING]]);
    if (hit) {
      push(hit[0], i, hit[1]);
      i = hit[1];
      continue;
    }
    if (c === "{" || c === ";" || c === "}") {
      mode = "declaration";
      i++;
      continue;
    }
    if (c === "@") {
      IDENT.lastIndex = i + 1;
      const at = IDENT.exec(text);
      const end = i + 1 + (at ? at[0].length : 0);
      push("keyword", i, end);
      i = end;
      mode = "prelude"; // "@media (min-width: 600px)", until { or ;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (mode === "declaration") mode = atDeclarationStart() ? "property" : "selector";
    if (mode === "prelude") {
      const number = /^-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/.exec(text.slice(i));
      if (number && !/[\w-]/.test(text[i - 1] ?? "")) {
        push("number", i, i + number[0].length);
        i += number[0].length;
        continue;
      }
      IDENT.lastIndex = i;
      const word = IDENT.exec(text);
      if (word) {
        const end = i + word[0].length;
        if (text.slice(end).trimStart().startsWith(":")) push("property", i, end);
        else if (text[end] === "(") push("function", i, end);
        i = end;
        continue;
      }
      i++;
      continue;
    }
    if (mode === "property") {
      IDENT.lastIndex = i;
      const name = IDENT.exec(text);
      if (name) {
        push("property", i, i + name[0].length);
        i += name[0].length;
      } else {
        i++;
      }
      if (text.slice(i).trimStart().startsWith(":")) {
        i = text.indexOf(":", i) + 1;
        mode = "value";
      }
      continue;
    }
    if (mode === "value") {
      if (c === "!") {
        const important = /^!\s*important/i.exec(text.slice(i));
        if (important) {
          push("keyword", i, i + important[0].length);
          i += important[0].length;
          continue;
        }
      }
      if (c === "#") {
        const hex = /^#[\da-fA-F]{3,8}\b/.exec(text.slice(i));
        if (hex) {
          push("number", i, i + hex[0].length);
          i += hex[0].length;
          continue;
        }
      }
      const number = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?/.exec(text.slice(i));
      if (number && !/[\w-]/.test(text[i - 1] ?? "")) {
        push("number", i, i + number[0].length);
        i += number[0].length;
        continue;
      }
      IDENT.lastIndex = i;
      const word = IDENT.exec(text);
      if (word) {
        const end = i + word[0].length;
        if (text[end] === "(") push("function", i, end);
        i = end;
        continue;
      }
      i++;
      continue;
    }
    // selector mode
    if (c === "." || c === "#") {
      IDENT.lastIndex = i + 1;
      const name = IDENT.exec(text);
      const end = i + 1 + (name ? name[0].length : 0);
      push("attribute", i, end);
      i = end;
      continue;
    }
    if (c === ":") {
      const pseudo = /^::?-?[A-Za-z_][\w-]*/.exec(text.slice(i));
      if (pseudo) {
        push("keyword", i, i + pseudo[0].length);
        i += pseudo[0].length;
        continue;
      }
    }
    if (c === "[") {
      const end = text.indexOf("]", i);
      const stop = end < 0 ? text.length : end + 1;
      push("attribute", i, stop);
      i = stop;
      continue;
    }
    IDENT.lastIndex = i;
    const tag = IDENT.exec(text);
    if (tag) {
      push("tag", i, i + tag[0].length);
      i += tag[0].length;
      continue;
    }
    i++;
  }
  return tokens;
}

function html(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i + 4);
      const stop = end < 0 ? text.length : end + 3;
      tokens.push(["comment", i, stop]);
      i = stop;
      continue;
    }
    if (/^<!doctype/i.test(text.slice(i, i + 9))) {
      const stop = text.indexOf(">", i) + 1 || text.length;
      tokens.push(["keyword", i, stop]);
      i = stop;
      continue;
    }
    const open = /^<\/?([A-Za-z][\w:-]*)/.exec(text.slice(i));
    if (!open) {
      i++;
      continue;
    }
    const name = open[1].toLowerCase();
    const closing = text[i + 1] === "/";
    tokens.push(["tag", i, i + open[0].length]);
    i += open[0].length;
    // attributes, up to > or />
    while (i < text.length && text[i] !== ">") {
      if (/\s/.test(text[i]) || text[i] === "/") {
        i++;
        continue;
      }
      if (text[i] === "=") {
        i++;
        while (/\s/.test(text[i] ?? "")) i++;
        const value = /^(?:"[^"]*"?|'[^']*'?|[^\s>]+)/.exec(text.slice(i));
        if (value) {
          tokens.push(["string", i, i + value[0].length]);
          i += value[0].length;
        }
        continue;
      }
      const attribute = /^[^\s"'>/=]+/.exec(text.slice(i));
      if (attribute) {
        tokens.push(["attribute", i, i + attribute[0].length]);
        i += attribute[0].length;
      } else {
        i++;
      }
    }
    if (text[i] === ">") {
      tokens.push(["tag", i, i + 1]);
      i++;
    }
    // Raw-text elements: color their contents as the embedded language.
    if (!closing && (name === "script" || name === "style")) {
      const end = text.toLowerCase().indexOf(`</${name}`, i);
      const stop = end < 0 ? text.length : end;
      tokens.push(...tokenize(text.slice(i, stop), name === "script" ? "js" : "css", i));
      i = stop;
    }
  }
  return tokens;
}
