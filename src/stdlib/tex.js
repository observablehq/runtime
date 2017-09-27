import require, {resolve as resource} from "./require";

var tex;

function katex(katex) {
  return new Promise(function(resolve, reject) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = resource("katex/dist/katex.min.css");
    link.onerror = reject;
    link.onload = function() {
      resolve(function(strings) {
        var string = strings[0] + "", i = 0, n = arguments.length;
        while (++i < n) string += arguments[i] + "" + strings[i];
        var root = document.createElement("div");
        katex.render(string, root);
        return root;
      });
    };
    document.head.appendChild(link);
  });
}

export default {
  then: function(resolved, rejected) {
    return (tex || (tex = require("katex").then(katex))).then(resolved, rejected);
  }
};
