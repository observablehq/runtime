var id = 0;

function url(name) {
  if (/^(\w+:)?\/\//i.test(name) || /^[.]{0,2}\//i.test(name)) return name;
  if (!name.length || /^[\s._]/.test(name) || /\s$/.test(name)) throw new Error("illegal name");
  return "https://unpkg.com/" + name + "?module";
}

export default function(name) {
  return new Promise(function(resolve) {
    var global = "__runtime_import_" + ++id;
    window[global] = function(module) {
      resolve(module);
      delete window[global];
      script.remove();
    };
    var script = document.createElement("script");
    script.type = "module";
    script.textContent = "import * as m from \"" + url(name) + "\"; window." + global + "(m);";
    document.head.appendChild(script);
  });
}
