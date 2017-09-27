import {require} from "d3-require";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import tex from "./tex";
import Promises from "./promises/index";

export default {
  DOM: DOM,
  Files: Files,
  Generators: Generators,
  Promises: Promises,
  require: require,
  html: html,
  md: md,
  tex: tex
};
