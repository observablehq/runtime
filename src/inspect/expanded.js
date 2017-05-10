import dispatchUpdate from "../variable/dispatchUpdate";
import inspectCollapsed from "./collapsed";
import inspect from "./index";

export default function inspectExpanded(object) {
  var span = document.createElement("span"),
      array = Array.isArray(object),
      keys = Object.keys(object), n = keys.length; // TODO Show missing entries in sparse arrays?

  span.className = "d3--expanded";

  var a = span.appendChild(document.createElement("a"));
  a.textContent = "▾" + (array ? "Array(" + object.length + ") [" : object.constructor.name + " {");
  a.addEventListener("mouseup", function clicked(event) {
    event.stopPropagation();
    var spanNew = inspectCollapsed(object);
    span.parentNode.replaceChild(spanNew, span);
    dispatchUpdate(spanNew);
  });

  for (var i = 0, j = Math.min(20, n); i < j; ++i) {
    var item = span.appendChild(document.createElement("div")),
        key = keys[i], spanKey = item.appendChild(document.createElement("span"));
    spanKey.className = "d3--" + (array && (key === (key | 0) + "") ? "index" : "key");
    spanKey.textContent = "  " + key;
    item.className = "d3--field";
    item.appendChild(document.createTextNode(": "));
    item.appendChild(inspect(object[key]));
  }

  if (i < n) {
    var a = span.appendChild(document.createElement("a"));
    a.className = "d3--field";
    a.style.display = "block";
    a.appendChild(document.createTextNode("  … " + (n - i) + " more"));
    a.addEventListener("mouseup", function clicked(event) {
      event.stopPropagation();
      for (var j = Math.min(i + 20, n); i < j; ++i) {
        var item = span.insertBefore(document.createElement("div"), span.lastChild.previousSibling),
            key = keys[i], spanKey = item.appendChild(document.createElement("span"));
        spanKey.className = "d3--" + (array && (key === (key | 0) + "") ? "index" : "key");
        spanKey.textContent = "  " + key;
        item.className = "d3--field";
        item.appendChild(document.createTextNode(": "));
        item.appendChild(inspect(object[key]));
      }
      if (i < n) {
        span.lastChild.previousSibling.textContent = "  … " + (n - i) + " more";
      } else {
        span.removeChild(span.lastChild.previousSibling);
      }
      dispatchUpdate(span);
    });
  }

  span.appendChild(document.createTextNode(array ? "]" : "}"));

  return span;
}
