import {requireFrom} from "d3-require";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import Promises from "./promises/index";
import tex from "./tex";

function unpkg(name) {
  if (!name.length || /^[\s._]/.test(name) || /\s$/.test(name)) throw new Error("illegal name");
  return "https://unpkg.com/" + name;
}

export default function(resolve) {
  if (resolve == null) resolve = unpkg;
  var require = requireFrom(resolve);
  return {
    DOM: DOM,
    Files: Files,
    Generators: Generators,
    Promises: Promises,
    require: require,
    html: html,
    md: md(require, resolve),
    tex: tex(require, resolve)
  };
}
