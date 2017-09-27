import {require} from "d3-require";

var md;

function marked(marked) {
  return function(strings) {
    var string = strings[0] + "", i = 0, n = arguments.length;
    while (++i < n) string += arguments[i] + "" + strings[i];
    var root = document.createElement("div");
    root.innerHTML = marked.parse(string);
    root.querySelectorAll("pre code").forEach(marked.highlightBlock);
    return root.childNodes.length === 1 ? root.removeChild(root.firstChild) : root;
  };
}

export default {
  then: function(resolved, rejected) {
    return (md || (md = require("marked", "highlight.js").then(marked))).then(resolved, rejected);
  }
};
