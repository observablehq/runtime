import dispatch from "../dispatch";
import inspectCollapsed from "./collapsed";
import formatSymbol from "./formatSymbol";
import getKeysAndSymbols from "./getKeysAndSymbols";
import inspect, {replace} from "./index";
import isArrayIndex from "./isArrayIndex";
import isArrayLike from "./isArrayLike";
import {maybeProperty} from "./forbidden";
import tagof from "./tagof";

export default function inspectExpanded(object) {
  var span = document.createElement("span"),
      arrayLike = isArrayLike(object),
      tag = tagof(object),
      fields,
      n;

  span.className = "O--expanded";

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
    replace(span, inspectCollapsed(object));
  });

  for (var i = 0, j = Math.min(20, n); i < j; ++i) {
    span.appendChild(fields.next().value);
  }

  if (i < n) {
    var a = span.appendChild(document.createElement("a"));
    a.className = "O--field";
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
    item.className = "O--field";
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
    item.className = "O--field";
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
    item.className = "O--field";
    if (typeof key === "symbol") {
      span.className = "O--symbol";
      span.textContent = `  ${formatSymbol(key)}`;
    } else {
      span.className = `O--${array && isArrayIndex(key) ? "index" : "key"}`;
      span.textContent = `  ${key}`;
    }
    item.appendChild(document.createTextNode(": "));
    item.appendChild(inspect(maybeProperty(object, key)));
    yield item;
  }
}
