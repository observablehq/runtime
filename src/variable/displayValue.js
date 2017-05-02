import inspect from "../inspect/index";

export default function displayValue(variable, value) {
  var node = variable._node;
  if (!(value instanceof Node) || (value.parentNode && value.parentNode !== node)) {
    node.className = "result result--inspector";
    value = inspect(value, false, node.firstChild // TODO Do this better.
        && node.firstChild.classList
        && node.firstChild.classList.contains("type--expanded"));
  } else {
    node.className = "result";
  }
  if (node.firstChild !== value) {
    if (node.firstChild) {
      while (node.lastChild !== node.firstChild) node.removeChild(node.lastChild);
      node.replaceChild(value, node.firstChild);
    } else {
      node.appendChild(value);
    }
  }
  variable._node.classList.add("result--changed");
  if (variable._timeout) clearTimeout(variable._timeout);
  variable._timeout = setTimeout(function() { variable._node.classList.remove("result--changed"); }, 250);
  // TODO variable_resize(variable);
}
