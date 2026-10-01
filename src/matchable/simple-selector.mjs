// Parses the one kind of selector query-container needs -- a single
// compound selector describing one element to create:
//
//   tag#id.class.class[attr][attr=value][attr="quoted value"]
//
// Unquoted attribute values run to the closing "]", so
// `[style=color:blue;font-weight:bold]` works. Replaces the parsel-js
// dependency (a full CSS selector parser, needed an import map in
// no-build pages) for this small subset.

const NAME = /^-?[_a-zA-Z -￿][-\w -￿]*/;

/**
 * @param {string} text
 * @returns {{ tag: string | null, id: string | null, classes: string[], attributes: [string, string][] }}
 */
export function parseSimpleSelector(text) {
  const result = { tag: null, id: null, classes: [], attributes: [] };
  let rest = (text ?? "").trim();
  const take = (pattern) => {
    const match = pattern.exec(rest);
    if (!match) throw new SyntaxError(`Unsupported selector: "${text}"`);
    rest = rest.slice(match[0].length);
    return match[0];
  };
  if (NAME.test(rest)) result.tag = take(NAME).toLowerCase();
  while (rest) {
    const sigil = rest[0];
    rest = rest.slice(1);
    if (sigil === "#") {
      result.id = take(NAME);
    } else if (sigil === ".") {
      result.classes.push(take(NAME));
    } else if (sigil === "[") {
      const name = take(/^\s*[^\s=\]]+/).trim();
      let value = "";
      rest = rest.trimStart();
      if (rest[0] === "=") {
        rest = rest.slice(1).trimStart();
        const quote = rest[0] === '"' || rest[0] === "'" ? rest[0] : null;
        if (quote) {
          const end = rest.indexOf(quote, 1);
          if (end < 0) throw new SyntaxError(`Unclosed quote in selector: "${text}"`);
          value = rest.slice(1, end);
          rest = rest.slice(end + 1).trimStart();
        } else {
          const end = rest.indexOf("]");
          if (end < 0) throw new SyntaxError(`Unclosed [ in selector: "${text}"`);
          value = rest.slice(0, end).trim();
          rest = rest.slice(end);
        }
      }
      if (rest[0] !== "]") throw new SyntaxError(`Unclosed [ in selector: "${text}"`);
      rest = rest.slice(1);
      result.attributes.push([name, value]);
    } else {
      throw new SyntaxError(`Unsupported selector: "${text}"`);
    }
  }
  return result;
}

/**
 * Create the element a simple selector describes. No tag means <template>.
 * @param {string} text
 * @returns {Element}
 */
export function elementFromSelector(text) {
  const { tag, id, classes, attributes } = parseSimpleSelector(text);
  const element = document.createElement(tag ?? "template");
  if (id) element.id = id;
  if (classes.length) element.classList.add(...classes);
  for (const [name, value] of attributes) element.setAttribute(name, value);
  return element;
}
