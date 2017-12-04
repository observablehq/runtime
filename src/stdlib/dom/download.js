export default function(object, name, label) {
  const a = document.createElement("a");
  const button = a.appendChild(document.createElement("button"));
  button.textContent = label == null ? "Download" : label;
  a.download = name == null ? "untitled" : name;
  a.onclick = function() {
    const url = a.href = URL.createObjectURL(object);
    setTimeout(function() { URL.revokeObjectURL(url); }, 50);
  };
  return a;
}
