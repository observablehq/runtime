export default function displayError(variable, error) {
  variable._node.textContent = error;
}
