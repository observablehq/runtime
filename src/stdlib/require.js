import {requireFrom} from "d3-require";
import stdlib from "./index";

var require = requireFrom(resolve);

export var resolve = function(name) {
  if (!name.length || /^[\s._]/.test(name) || /\s$/.test(name)) throw new Error("illegal name");
  return "https://unpkg.com/" + name;
};

export function resolver(_) {
  if (typeof _ !== "function") throw new TypeError("not a function");
  stdlib.require = require = requireFrom(resolve = _);
}

export default require;
