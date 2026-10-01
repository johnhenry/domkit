# matchable

Two elements that react to media queries from HTML attributes alone, with
no CSS `@media` blocks and no `matchMedia` listeners to manage:

| Element | What it changes when a query matches |
|---|---|
| [query-container](./query-container/readme.md) | *What element wraps* the children: a `<ul>` on narrow screens, an `<ol>` on wide ones, and so on |
| [attribute-provider](./attribute-provider/readme.md) | *The classes, inline styles, or attributes* on the existing children |

Both re-evaluate live as the viewport changes, and both stop listening
when disconnected.

## The shared query grammar

Every query attribute in this family is a pipe-separated (`|`) list of
sections. A section is `[media query] value`, or just `value` with no
bracket, which always applies:

```
fallback-value | [(min-width: 600px)] wide-value | [(orientation: portrait)] tall-value
```

When several sections match, the **last** matching one wins for
`query-container`. For `attribute-provider`, every matching section
applies, in order. The grammar is parsed in exactly one place,
[`query-sections.mjs`](./query-sections.mjs), so the two elements can't
drift apart. They did once, before that file existed.

## Usage

```html
<script type="module" src="https://esm.sh/@johnhenry/domkit/matchable/query-container/global.mjs"></script>
<script type="module" src="https://esm.sh/@johnhenry/domkit/matchable/attribute-provider/global.mjs"></script>
```

or with a bundler:

```js
import "@johnhenry/domkit/matchable/query-container/global.mjs";
import "@johnhenry/domkit/matchable/attribute-provider/global.mjs";
```

`query-container` depends on [`parsel-js`](https://github.com/LeaVerou/parsel)
(a real npm dependency of this package) to parse its selector values. If
you load the raw source in a browser without a CDN or bundler, map that
bare specifier with an import map, as these demos do:
[`query-container/demo.htm`](./query-container/demo.htm).
