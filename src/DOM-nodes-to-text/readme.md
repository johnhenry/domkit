# Dom Nodes to text

Transform dom nodes into text. The inverse of
[text-to-DOM-nodes](../text-to-DOM-nodes/readme.md).

This is extremely useful when logging DOM nodes as they are often logged "live"
meaning that when you look at the console, you will see the latest state;
not the state at the time of logging.

## Usage

```html
<ul id="list">
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ul>
<script type="module">
  import domNodesToText from "..";
  console.log(domNodesToText(document.querySelector("#list")));
  /* logs
  <ul id="li">
    <li>one</li>
    <li>two</li>
    <li>three</li>
  </ul>
  */
</script>
```

### Multiple Nodes

Use the spread operatore to turn lists of nodes into text

```javascript
console.log(domNodesToText(...document.querySelectorAll("li")));
/* logs
  <li>one</li>
  <li>two</li>
  <li>three</li>
  */
```
