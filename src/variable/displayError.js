import dispatch from "./dispatch";

export default function displayError(variable, error) {
  var node = variable._node;
  if (!node) return;
  node.className = "O O--error";
  node.textContent = error + ""; // TODO Pretty stack trace.
  dispatch(node, "update");
}
