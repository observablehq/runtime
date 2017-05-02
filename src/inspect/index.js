import inspectCollapsed from "./collapsed";
import inspectExpanded from "./expanded";
import formatDate from "./formatDate";

export default function inspect(value, shallow, expand) {
  var type = typeof value;
  switch (type) {
    case "function": {
      var span = document.createElement("span");
      span.className = "type--" + type;
      span.textContent = "Function";
      return span;
    }
    case "object": {
      if (value === null) { type = null, value = "null"; break; }
      if (value instanceof Date) { type = "date", value = formatDate(value); break; }
      return (expand ? inspectExpanded : inspectCollapsed)(value, shallow);
    }
    default: {
      value += "";
      break;
    }
  }
  var span = document.createElement("span");
  span.className = "type--" + type;
  span.textContent = value;
  return span;
}
