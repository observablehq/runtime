export default function displayError(variable, error) {
  variable._node.className = "result result--error";
  variable._node.textContent = error + ""; // TODO Pretty stack trace.
  // TODO variable_resize(variable);
}
