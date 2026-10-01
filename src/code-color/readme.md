# code-color

Syntax highlighting for JavaScript, CSS, and HTML that **never changes
your markup**. It uses the
[CSS Custom Highlight API](https://developer.mozilla.org/docs/Web/API/CSS_Custom_Highlight_API):
each token is a range painted by a `::highlight()` style, so the text
stays exactly as you wrote it. Copy and paste, find-in-page, screen
readers, and even live editing work as on plain text, and it
re-highlights as the text changes.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/code-color/global.mjs"></script>
<link rel="stylesheet" href="https://esm.sh/@johnhenry/domkit/code-color/index.css" />

<code-color>
  <pre><code class="language-js">const greet = (name) => `Hello, ${name}`; // say hi</code></pre>
</code-color>

<code-color language="html">
  <pre>&lt;p class="note"&gt;HTML must be escaped, as always&lt;/p&gt;</pre>
</code-color>
```

It works with whatever markup you already have, including the
`<pre><code class="language-…">` that Markdown renderers produce. Wrap it
in `<code-color>`, and that's all.

## Attributes

| Attribute | Property | Description |
|---|---|---|
| `language` | `language` | `js`, `css`, or `html`. Aliases work: `javascript`, `ts`, `json`, `xml`, `svg`, `scss`, … Default: the `language-*` (or `lang-*`) class of a `<code>` inside, else `html` |

Read-only: `resolvedLanguage` (the language in effect, or `null` for an
unknown one) and `CodeColor.supported` (whether the browser has the
Highlight API). `tokens()` returns the current `{ type, text }` list.

HTML mode colors `<style>` and `<script>` contents as CSS and JS.

## Theming

`index.css` gives every token type a color with `light-dark()`, so it
follows your page's `color-scheme`. Each type is a named highlight you
can restyle with plain CSS:

```css
::highlight(domkit-keyword) { color: crimson; }
::highlight(domkit-comment) { color: gray; text-decoration: none; }
```

| Highlight | Colors |
|---|---|
| `domkit-comment` | comments |
| `domkit-keyword` | keywords, `@`-rules, pseudo-classes, `!important`, `<!doctype>` |
| `domkit-string` | strings, attribute values |
| `domkit-number` | numbers, CSS dimensions and hex colors |
| `domkit-function` | function calls and CSS functions |
| `domkit-property` | object properties, JSON keys, CSS properties |
| `domkit-tag` | HTML tags, CSS type selectors |
| `domkit-attribute` | HTML attributes, CSS classes/ids/attribute selectors |

`::highlight()` accepts only a few properties (`color`,
`background-color`, `text-decoration`, `text-shadow`). Highlights are
page-wide, so one theme applies to every `<code-color>`.

## Notes

- **Browser support:** the Highlight API is in Chromium, Safari 17.2+,
  and Firefox 140+. Elsewhere, code shows uncolored, and nothing breaks.
- The tokenizer is deliberately small: it colors the common cases well
  and never throws, but it isn't a parser. TypeScript and JSON are
  colored as JavaScript.
- `code-color:state(highlighted)` matches once highlighting is applied.
