# code-color

Syntax-highlights its own contents (HTML, CSS, or JavaScript) using
inline-styled `<span>`s, and highlights again whenever its children are
replaced. No stylesheet or build step needed.

## Usage

```html
<script
  type="module"
  src="https://esm.sh/@johnhenry/domkit/code-color/global.mjs"
></script>

<code-color mode="js">
<pre>const greet = (name) => `Hello, ${name}`; // say hi</pre>
</code-color>

<code-color>
<pre>&lt;p class="note"&gt;HTML is the default mode&lt;/p&gt;</pre>
</code-color>
```

## Attributes

| Attribute | Description |
|---|---|
| `mode` | `html` (default), `css`, or `js`. HTML mode also highlights `<style>`/`<script>` contents as CSS/JS |

## How it works

On connect, and on every child-list change after that, the element runs
[`w3-code-color.mjs`](./w3-code-color.mjs) over its own `innerHTML`.
That file is a vendored copy of W3Schools' highlighter, with two fixes so
it works as an ES module (strict mode) and inside `<pre>`. See the comments
in the file.

## Notes

- **HTML to highlight must be escaped** (`&lt;p&gt;`), as in the example.
  Unescaped tags are real elements and pass through untouched.
- The colors are fixed inline styles designed for a light background, and
  the font is set to a monospace stack. There are no CSS hooks for theming.
- Only changes to the element's *direct* children re-trigger highlighting.
  Replacing them (`codeColor.innerHTML = …`) does; editing the text inside
  its `<pre>` doesn't.
