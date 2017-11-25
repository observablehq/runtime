import {require as requireDefault, requireFrom} from "d3-require";
import constant from "../constant";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import Promises from "./promises/index";
import tex from "./tex";

export default function(resolve) {
  var require = resolve == null ? requireDefault : requireFrom(resolve);
  return {
    DOM: DOM,
    Files: Files,
    Generators: Generators,
    Promises: Promises,
    require: constant(require),
    html: constant(html),
    md: md(require, resolve),
    tex: tex(require, resolve)
  };
}
