// Inspiration https://stackoverflow.com/a/30581545/1290781
// Instances are real Arrays (see createMutableNodeList below) whose
// prototype chain runs through NodeList.prototype -- so the mutators can
// delegate to Array.prototype's, which already keep `length` right. The
// previous hand-rolled versions didn't: unshift() copied elements forward
// on an exotic Array, growing `length` on every write, and never finished.
const assertNodes = (nodes) => {
  for (const node of nodes) {
    if (!(node instanceof Node)) {
      throw new TypeError(`Expected a Node, got ${node}`);
    }
  }
};
const MutableNodeList = class extends NodeList {
  item(i = 0) {
    return this[i];
  }
  push(...nodes) {
    assertNodes(nodes);
    return Array.prototype.push.apply(this, nodes);
  }
  pop() {
    return Array.prototype.pop.call(this);
  }
  shift() {
    return Array.prototype.shift.call(this);
  }
  unshift(...nodes) {
    assertNodes(nodes);
    return Array.prototype.unshift.apply(this, nodes);
  }
  // Browsers' NodeList.prototype iteration methods *are* Array.prototype's
  // (per WebIDL), so they already work here; DOM implementations like
  // happy-dom read internal state instead. Pin the spec behavior.
  [Symbol.iterator]() {
    return Array.prototype.values.call(this);
  }
  values() {
    return Array.prototype.values.call(this);
  }
  keys() {
    return Array.prototype.keys.call(this);
  }
  entries() {
    return Array.prototype.entries.call(this);
  }
  forEach(callback, thisArg) {
    return Array.prototype.forEach.call(this, callback, thisArg);
  }
};

const createMutableNodeList = (...nodes) => {
  const list = Reflect.construct(Array, [], MutableNodeList);
  list.push(...nodes);
  return list;
};
export { MutableNodeList };
export default createMutableNodeList;
