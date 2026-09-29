import createElementNS from "./createElementNS.mjs";
const createElement = createElementNS(null);
export { default as fromString } from "../text-to-DOM-nodes/index.mjs";
export const _ = (...c) => createElement(...c);
export default createElement;
