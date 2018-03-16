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
    return formatFunction(type, f.name);
  }

  // An arrow function with a single argument.
  // foo =>
  // async foo =>
  if (m = /^(?:async\s*)?(\w+)\s*=>/.exec(t)) {
    return formatFunction(type, null, m[1]);
  }

  // An arrow function with parenthesized arguments.
  // (…)
  // async (…)
  if (m = /^(?:async\s*)?\((.*)\)/.exec(t)) {
    return formatFunction(type, null, m[1] && trim(m[1].replace(/\s*,\s*/g, ", ")));
  }

  // A function, possibly: async, generator, anonymous, simply arguments.
  // function name(…)
  // function* name(…)
  // async function name(…)
  // async function* name(…)
  if (m = /^(?:async\s*)?function(?:\s*\*)?(?:\s*\w+)?\s*\((.*)\)/.exec(t)) {
    return formatFunction(type, f.name, m[1] && trim(m[1].replace(/\s*,\s*/g, ", ")));
  }

  // Something else, like destructuring, comments or default values.
  return formatFunction(type, f.name, "…");
}

function trim(string) {
  return string.length > 60 ? string.substr(0, 60) + "…" : string;
}

function formatFunction(type, name, args) {
  var template = document.createElement("template");
  template.innerHTML = `<span class="O--function"><span class="O--keyword">${type.prefix}</span> ${name || ""}(<span class="O--gray">${args || ""}</span>)</span>`;
  return template.content.firstChild;
}
