import {isarray, isindex} from "./array";
import inspectExpanded from "./expanded";
import formatSymbol from "./formatSymbol";
import inspect, {replace} from "./index";
import {isown, symbolsof, tagof, valueof} from "./object";

export default function inspectCollapsed(object, shallow) {
  const arrayish = isarray(object);
  let tag, fields, next;

  if (object instanceof Map) {
    tag = `Map(${object.size})`;
    fields = iterateMap;
  } else if (object instanceof Set) {
    tag = `Set(${object.size})`;
    fields = iterateSet;
  } else if (arrayish) {
    tag = `${object.constructor.name}(${object.length})`;
    fields = iterateArray;
  } else {
    tag = tagof(object);
    fields = iterateObject;
  }

  if (shallow) {
    const span = document.createElement("span");
    span.className = "O--shallow";
    span.appendChild(document.createTextNode(tag));
    span.addEventListener("mouseup", function(event) {
      event.stopPropagation();
      replace(span, inspectCollapsed(object));
    });
    return span;
  }

  const span = document.createElement("span");
  span.className = "O--collapsed";
  const a = span.appendChild(document.createElement("a"));
  a.textContent = `▸${tag}${arrayish ? " [" : " {"}`;
  span.addEventListener("mouseup", function(event) {
    event.stopPropagation();
    replace(span, inspectExpanded(object));
  }, true);

  fields = fields(object);
  for (let i = 0; !(next = fields.next()).done && i < 20; ++i) {
    if (i > 0) span.appendChild(document.createTextNode(", "));
    span.appendChild(next.value);
  }

  if (!next.done) span.appendChild(document.createTextNode(", …"));
  span.appendChild(document.createTextNode(arrayish ? "]" : "}"));

  return span;
}

function* iterateMap(map) {
  for (const [key, value] of map) {
    yield formatMapField(key, value);
  }
  yield* iterateObject(map);
}

function* iterateSet(set) {
  for (const value of set) {
    yield inspect(value, true);
  }
  yield* iterateObject(set);
}

function* iterateArray(array) {
  for (let i0 = -1, i1 = 0, n = array.length; i1 < n; ++i1) {
    if (i1 in array) {
      let e = i1 - i0 - 1;
      if (e > 0) {
        const span = document.createElement("span");
        span.className = "O--empty";
        span.textContent = e === 1 ? "empty" : `empty × ${i1 - i0 - 1}`;
        yield span;
      }
      yield inspect(valueof(array, i1), true);
      i0 = i1;
    }
  }
  for (const key in array) {
    if (!isindex(key) && isown(array, key)) {
      yield formatField(key, valueof(array, key), "O--key");
    }
  }
  for (const symbol of symbolsof(array)) {
    yield formatField(formatSymbol(symbol), valueof(array, symbol), "O--symbol");
  }
}

function* iterateObject(object) {
  for (const key in object) {
    if (isown(object, key)) {
      yield formatField(key, valueof(object, key), "O--key");
    }
  }
  for (const symbol of symbolsof(object)) {
    yield formatField(formatSymbol(symbol), valueof(object, symbol), "O--symbol");
  }
}

function formatField(key, value, className) {
  const fragment = document.createDocumentFragment();
  const span = fragment.appendChild(document.createElement("span"));
  span.className = className;
  span.textContent = key;
  fragment.appendChild(document.createTextNode(": "));
  fragment.appendChild(inspect(value, true));
  return fragment;
}

function formatMapField(key, value) {
  const fragment = document.createDocumentFragment();
  fragment.appendChild(inspect(key, true));
  fragment.appendChild(document.createTextNode(" => "));
  fragment.appendChild(inspect(value, true));
  return fragment;
}
