import { createBlock } from "../../node_modules/blockdom/dist/index.js";
console.log(createBlock);
const cache = new WeakMap();
export function html(strings, ...args) {
  let templateFn = cache.get(strings);
  if (templateFn) return templateFn(args);
  const dataIdx = [];
  const childrenIdx = [];
  const blockDesc = strings
    .map((str, index) => {
      let arg = args[index];
      if (arg !== undefined) {
        if (str.endsWith("=")) {
          // either a handler, a ref or an attribute
          let i = dataIdx.push(index) - 1;
          let match = str.match(/\b(\w+)=$/);
          let prefix = str.slice(0, -match[0].length);
          if (match[1].startsWith("on")) {
            let event = match[1].slice(2).toLowerCase();
            return `${prefix}block-handler-${i}="${event}"`;
          } else if (match[1] === "ref") {
            return `${prefix}block-ref="${i}"`;
          } else {
            return `${prefix}block-attribute-${i}="${match[1]}"`;
          }
        }
        if (typeof arg === "string" || typeof arg === "number") {
          let i = dataIdx.push(index) - 1;
          return str + `<block-text-${i}/>`;
        } else {
          let i = childrenIdx.push(index) - 1;
          return str + `<block-child-${i}/>`;
        }
      }
      return str;
    })
    .join("");
  const block = createBlock(blockDesc);
  templateFn = (args) => {
    return block(
      dataIdx.map((d) => args[d]),
      childrenIdx.map((c) => args[c])
    );
  };
  return templateFn(args);
}
