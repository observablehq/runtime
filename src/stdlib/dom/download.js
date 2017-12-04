export default function(object, name, label) {
  var a = document.createElement("a"),
      b = a.appendChild(document.createElement("button"));
  b.textContent = label == null ? "Download" : label;
  a.download = name == null ? "untitled" : name;
  a.onclick = function() {
    var url = a.href = URL.createObjectURL(object);
    setTimeout(function() { URL.revokeObjectURL(url); }, 50);
  };
  return a;
}
