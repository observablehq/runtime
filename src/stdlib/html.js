export default function() {
  return function(strings) {
    var string = strings[0] + "", i = 0, n = arguments.length;
    while (++i < n) string += arguments[i] + "" + strings[i];
    var root = document.createElement("div"); root.innerHTML = string;
    return root.childNodes.length === 1 ? root.removeChild(root.firstChild) : root;
  };
}
