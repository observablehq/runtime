var toString = Function.prototype.toString,
    TYPE_ASYNC = {prefix: "async ƒ"},
    TYPE_ASYNC_GENERATOR = {prefix: "async ƒ*"},
    TYPE_CLASS = {prefix: "class"},
    TYPE_FUNCTION = {prefix: "ƒ"},
    TYPE_GENERATOR = {prefix: "ƒ*"};

export default function inspectFunction(f) {
  var type, m, t = toString.call(f);

  switch (f.constructor && f.constructor.name) {
    case "AsyncFunction": type = TYPE_ASYNC; break;
    case "AsyncGeneratorFunction": type = TYPE_ASYNC_GENERATOR; break;
    case "GeneratorFunction": type = TYPE_GENERATOR; break;
    default: type = /^class\b/.test(t) ? TYPE_CLASS : TYPE_FUNCTION; break;
  }

  // A class, possibly named.
  // class Name
  if (type === TYPE_CLASS) {
    return formatFunction(type, f.name || "");
  }

  // An arrow function with a single argument.
  // foo =>
  // async foo =>
  if (m = /^(?:async\s*)?(\w+)\s*=>/.exec(t)) {
    return formatFunction(type, "(" + m[1] + ")");
  }

  // An arrow function with parenthesized arguments.
  // (…)
  // async (…)
  if (m = /^(?:async\s*)?\(\s*(\w+(?:\s*,\s*\w+)*)?\s*\)/.exec(t)) {
    return formatFunction(type, m[1] ? "(" + m[1].replace(/\s*,\s*/g, ", ") + ")" : "()");
  }

  // A function, possibly: async, generator, anonymous, simply arguments.
  // function name(…)
  // function* name(…)
  // async function name(…)
  // async function* name(…)
  if (m = /^(?:async\s*)?function(?:\s*\*)?(?:\s*\w+)?\s*\(\s*(\w+(?:\s*,\s*\w+)*)?\s*\)/.exec(t)) {
    return formatFunction(type, (f.name || "") + (m[1] ? "(" + m[1].replace(/\s*,\s*/g, ", ") + ")" : "()"));
  }

  // Something else, like destructuring, comments or default values.
  return formatFunction(type, (f.name || "") + "(…)");
}

function formatFunction(type, name) {
  var span = document.createElement("span");
  span.className = "O--function";
  var spanType = span.appendChild(document.createElement("span"));
  spanType.className = "O--keyword";
  spanType.textContent = type.prefix;
  span.appendChild(document.createTextNode(" " + name));
  return span;
}
