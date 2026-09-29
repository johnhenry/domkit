// Inspiration https://stackoverflow.com/a/30581545/1290781
const MutableNodeList = class extends NodeList {
  item(i = 0) {
    return this[i];
  }
  push(...nodes) {
    for (const node of nodes) {
      if (!(node instanceof Node)) {
        throw new Error();
      }
      this[this.length++] = node;
    }
    return this.length;
  }
  pop() {
    const popped = this[this.length - 1];
    delete this[this.length - 1];
    this.length--;
    return popped;
  }
  shift() {
    const shifted = this[0];
    delete this[0];
    for (let i = 0; i < this.length; i++) {
      this[i] = this[i + 1];
    }
    delete this[this.length - 1];
    this.length--;
    return shifted;
  }
  unshift(...nodes) {
    for (const node of nodes) {
      if (!(node instanceof Node)) {
        throw new Error();
      }
    }
    const size = nodes.length;
    for (let i = 0; i < this.length; i++) {
      this[i + size] = this[i];
    }
    for (let i = 0; i < size; i++) {
      this[i] = nodes[i];
    }
    this.length += size;
    return this.length;
  }
};

const createMutableNodeList = (...nodes) => {
  const list = Reflect.construct(Array, [], MutableNodeList);
  list.push(...nodes);
  return list;
};
export { MutableNodeList };
export default createMutableNodeList;
