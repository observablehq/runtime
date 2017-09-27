import inspect from "../inspect/index";
import dispatch from "./dispatch";

export default function displayValue(variable, value) {
  var node = variable._node;
  if (!node) return;
  if ((value instanceof Element || value instanceof Text) && (!value.parentNode || value.parentNode === node)) {
    node.className = "O";
  } else {
    node.className = "O O--inspect";
    value = inspect(value, false, node.firstChild // TODO Do this better.
        && node.firstChild.classList
        && node.firstChild.classList.contains("O--expanded"));
  }
  if (node.firstChild !== value) {
    if (node.firstChild) {
      while (node.lastChild !== node.firstChild) node.removeChild(node.lastChild);
      node.replaceChild(value, node.firstChild);
    } else {
      node.appendChild(value);
    }
  }
  dispatch(node, "update");
}
