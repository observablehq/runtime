import dispatch from "../variable/dispatch";
import inspectCollapsed from "./collapsed";
import Entry from "./entry";
import formatSymbol from "./formatSymbol";
import getKeysAndSymbols from "./getKeysAndSymbols";
import inspect from "./index";
import isArrayIndex from "./isArrayIndex";
import isArrayLike from "./isArrayLike";

export default function inspectExpanded(object) {
  var span = document.createElement("span"),
      arrayLike = isArrayLike(object),
      tag = object[Symbol.toStringTag] || object.constructor.name,
      fields,
      n;

  span.className = "d3--expanded";

  if (object instanceof Map) {
    n = object.size;
    tag += `(${n})`;
    fields = mapFields(object);
  } else if (object instanceof Set) {
    n = object.size;
    tag += `(${n})`;
    fields = setFields(object);
  } else {
    n = getKeysAndSymbols(object).length;
    if (arrayLike) tag += `(${n})`;
    fields = objectFields(object);
  }

  var a = span.appendChild(document.createElement("a"));
  a.textContent = `▾${tag}${arrayLike ? " [" : " {"}`;
  a.addEventListener("mouseup", function clicked(event) {
    event.stopPropagation();
    var spanNew = inspectCollapsed(object);
    span.parentNode.replaceChild(spanNew, span);
    dispatch(spanNew, "load");
  });

  for (var i = 0, j = Math.min(20, n); i < j; ++i) {
    span.appendChild(fields.next().value);
  }

  if (i < n) {
    var a = span.appendChild(document.createElement("a"));
    a.className = "d3--field";
    a.style.display = "block";
    a.appendChild(document.createTextNode(`  … ${n - i} more`));
    a.addEventListener("mouseup", function clicked(event) {
      event.stopPropagation();
      for (var j = Math.min(i + 20, n); i < j; ++i) {
        span.insertBefore(fields.next().value, span.lastChild.previousSibling);
      }
      if (i < n) {
        span.lastChild.previousSibling.textContent = `  … ${n - i} more`;
      } else {
        span.removeChild(span.lastChild.previousSibling);
      }
      dispatch(span, "load");
    });
  }

  span.appendChild(document.createTextNode(arrayLike ? "]" : "}"));

  return span;
}

function* mapFields(object) {
  for (var [key, value] of object.entries()) {
    var item = document.createElement("div");
    item.className = "d3--field";
    item.appendChild(document.createTextNode("  "));
    item.appendChild(inspect(key));
    item.appendChild(document.createTextNode(" => "));
    item.appendChild(inspect(value));
    yield item;
  }
}

function* setFields(object) {
  for (var value of object.values()) {
    var item = document.createElement("div");
    item.className = "d3--field";
    item.appendChild(document.createTextNode("  "));
    item.appendChild(inspect(value));
    yield item;
  }
}

function* objectFields(object) {
  var array = isArrayLike(object);
  for (var key of getKeysAndSymbols(object)) {
    var item = document.createElement("div"),
        span = item.appendChild(document.createElement("span"));
    item.className = "d3--field";
    if (typeof key === "symbol") {
      span.className = "d3--symbol";
      span.textContent = `  ${formatSymbol(key)}`;
    } else {
      span.className = `d3--${array && isArrayIndex(key) ? "index" : "key"}`;
      span.textContent = `  ${key}`;
    }
    item.appendChild(document.createTextNode(": "));
    item.appendChild(inspect(object[key]));
    yield item;
  }
}
