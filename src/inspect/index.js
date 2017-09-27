import inspectCollapsed from "./collapsed";
import inspectExpanded from "./expanded";
import formatDate from "./formatDate";
import formatError from "./formatError";
import formatRegExp from "./formatRegExp";
import formatSymbol from "./formatSymbol";
import Import from "./import";
import inspectFunction from "./inspectFunction";

var objectToString = Object.prototype.toString;

export default function inspect(value, shallow, expand) {
  var type = typeof value;
  switch (type) {
    case "function": { return inspectFunction(value); }
    case "object": {
      if (value === null) { type = null, value = "null"; break; }
      if (value instanceof Date) { type = "date", value = formatDate(value); break; }
      if (value === Import) { type = "import", value = "Import"; break; }
      switch (objectToString.call(value)) { // TODO Symbol.toStringTag?
        case "[object RegExp]": { type = "regexp", value = formatRegExp(value); break; }
        case "[object Error]": // https://github.com/lodash/lodash/blob/master/isError.js#L26
        case "[object DOMException]": { type = "error", value = formatError(value); break; }
        default: return (expand ? inspectExpanded : inspectCollapsed)(value, shallow);
      }
      break;
    }
    case "symbol": { value = formatSymbol(value); break; }
    default: {
      value += "";
      if (shallow && !expand && value.length > 100) value = `${value.slice(0, 50)}…${value.slice(-49)}`;
      break;
    }
  }
  var span = document.createElement("span");
  span.className = `d3--${type}`;
  span.textContent = value;
  return span;
}
