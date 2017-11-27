export default function(require) {
  return function() {
    return require("/marked.js").then(function(marked) {
      return function(strings) {
        var string = strings[0] + "", i = 0, n = arguments.length;
        while (++i < n) string += arguments[i] + "" + strings[i];
        var root = document.createElement("div");
        root.innerHTML = marked(string).trim();
        var code = root.querySelectorAll("pre code");
        if (code.length > 0) require("/highlight.js").then(function(hl) { code.forEach(hl.highlightBlock); });
        return root.childNodes.length === 1 ? root.removeChild(root.firstChild) : root;
      };
    });
  };
}
