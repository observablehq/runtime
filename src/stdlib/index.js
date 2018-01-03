import {resolve as resolveDefault, requireFrom} from "d3-require";
import constant from "../constant";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import now from "./now";
import Promises from "./promises/index";
import tex from "./tex";
import width from "./width";

export default function(resolve) {
  if (resolve == null) resolve = resolveDefault;
  var require = requireFrom(resolve);
  require.at = requireAt(resolve);
  return {
    DOM: DOM,
    Files: Files,
    Generators: Generators,
    Promises: Promises,
    require: constant(require),
    resolve: constant(resolve),
    html: html,
    md: md(require, resolve),
    tex: tex(require, resolve),
    now: now,
    width: width
  };
}

function requireAt(resolve) {
  return function(version) {
    return requireFrom(function(name) {
      return resolve(name in version ? name + "@" + version[name] : name);
    });
  };
}
