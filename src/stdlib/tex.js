function style(href) {
  return new Promise(function(resolve, reject) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onerror = reject;
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

export default function(require, resource) {
  return function() {
    return Promise.all([
      require("katex@0.8.3/dist/katex.min.js"),
      style(resource("katex@0.8.3/dist/katex.min.css"))
    ]).then(function(values) {
      var katex = values[0], tex = renderer();

      function renderer(options) {
        return function(strings) {
          var string = strings[0] + "", i = 0, n = arguments.length;
          while (++i < n) string += arguments[i] + "" + strings[i];
          var root = document.createElement("div");
          katex.render(string, root, options);
          return root.removeChild(root.firstChild);
        };
      }

      tex.block = renderer({displayMode: true});
      return tex;
    });
  };
}
