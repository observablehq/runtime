import dispatch from "../variable/dispatch";
import inspectExpanded from "./expanded";
import inspect from "./index";
import isArrayIndex from "./isArrayIndex";
import isArrayLike from "./isArrayLike";
import getKeysAndSymbols from "./getKeysAndSymbols";
import formatSymbol from "./formatSymbol";

export default function inspectCollapsed(object, shallow) {
  var span = document.createElement("span"),
      arrayLike = isArrayLike(object),
      tag = object[Symbol.toStringTag] || object.constructor.name,
      n;

  if (object instanceof Map || object instanceof Set) tag += `(${object.size})`;
  else if (arrayLike) tag += `(${object.length})`;

  if (shallow) {
    span.appendChild(document.createTextNode(tag));
    span.className = "d3--shallow";
    span.addEventListener("mouseup", function clicked(event) {
      event.stopPropagation();
      var spanNew = inspectCollapsed(object);
      span.parentNode.replaceChild(spanNew, span);
      dispatch(spanNew, "load");
    });
    return span;
  }

  var a = span.appendChild(document.createElement("a"));
  a.textContent = `▸${tag}${arrayLike ? " [" : " {"}`;
  span.className = "d3--collapsed";

  if (object instanceof Set) {
    var values = object.values();
    for (var i = 0, j = Math.min(20, n = object.size); i < j; ++i) {
      var {value} = values.next();
      if (i > 0) span.appendChild(document.createTextNode(", "));
      span.appendChild(inspect(value, true));
    }
  } else if (object instanceof Map) {
    var entries = object.entries();
    for (var i = 0, j = Math.min(20, n = object.size); i < j; ++i) {
      var {value: [key, value]} = entries.next();
      if (i > 0) span.appendChild(document.createTextNode(", "));
      span.appendChild(inspect(key, true));
      span.appendChild(document.createTextNode(" => "));
      span.appendChild(inspect(value, true));
    }
  } else {
    var keys = getKeysAndSymbols(object); // TODO Show missing entries in sparse arrays?
    for (var i = 0, j = Math.min(20, n = keys.length); i < j; ++i) {
      if (i > 0) span.appendChild(document.createTextNode(", "));
      var key = keys[i];
      if (!arrayLike || !isArrayIndex(key)) {
        var spanKey = span.appendChild(document.createElement("span"));
        if (typeof key === "symbol") {
          spanKey.className = "d3--symbol";
          spanKey.textContent = formatSymbol(key);
        } else {
          spanKey.className = "d3--key";
          spanKey.textContent = key;
        }
        span.appendChild(document.createTextNode(": "));
      }
      span.appendChild(inspect(object[key], true));
    }
  }

  if (i < n) span.appendChild(document.createTextNode(", …"));
  span.appendChild(document.createTextNode(arrayLike ? "]" : "}"));

  span.addEventListener("mouseup", function clicked(event) {
    event.stopPropagation();
    var spanNew = inspectExpanded(object);
    span.parentNode.replaceChild(spanNew, span);
    dispatch(spanNew, "load");
  }, true);

  return span;
}
