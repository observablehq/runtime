import dispatchUpdate from "../variable/dispatchUpdate";
import inspectExpanded from "./expanded";
import inspect from "./index";

export default function inspectCollapsed(object, shallow) {
  var span = document.createElement("span"),
      array = Array.isArray(object),
      keys = Object.keys(object), n = keys.length; // TODO Show missing entries in sparse arrays?

  if (shallow) {
    span.appendChild(document.createTextNode(array ? "Array(" + object.length + ")" : object.constructor.name));
    span.className = "type--shallow";
    span.addEventListener("mouseup", function clicked(event) {
      event.stopPropagation();
      var spanNew = inspectCollapsed(object);
      span.parentNode.replaceChild(spanNew, span);
      dispatchUpdate(spanNew);
    });
    return span;
  }

  var a = span.appendChild(document.createElement("a"));
  a.textContent = "▸" + (array ? "Array(" + object.length + ") [" : object.constructor.name + " {");
  span.className = "type--collapsed";

  for (var i = 0, j = Math.min(20, n); i < j; ++i) {
    if (i > 0) span.appendChild(document.createTextNode(", "));
    var key = keys[i];
    if (!array || (key !== (key | 0) + "")) {
      var spanKey = span.appendChild(document.createElement("span"));
      spanKey.className = "type--key";
      spanKey.textContent = key;
      span.appendChild(document.createTextNode(": "));
    }
    span.appendChild(inspect(object[key], true));
  }

  if (i < n) span.appendChild(document.createTextNode(", …"));
  span.appendChild(document.createTextNode(array ? "]" : "}"));

  span.addEventListener("mouseup", function clicked(event) {
    event.stopPropagation();
    var spanNew = inspectExpanded(object);
    span.parentNode.replaceChild(spanNew, span);
    dispatchUpdate(spanNew);
  }, true);

  return span;
}
