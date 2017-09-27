var functionToString = Function.prototype.toString;

/**
 * Modeled after, and should continue to have parity with the devtools-frontend
 * implementation.
 *
 * https://github.com/ChromeDevTools/devtools-frontend/blob/2586fc8a71ba3aa82683fa93d802509b84ba9b46/front_end/object_ui/ObjectPropertiesSection.js#L130-L393
 *
 * Only uses the "abbreviation" form for now.
 *
 */
export default function inspectFunctionLike(fn) {
  var text = functionToString.call(fn);
  // This set of best-effort regular expressions captures common function descriptions.
  // Ideally, some parser would provide prefix, arguments, function body text separately.
  var isAsync = text.startsWith("async function ");
  var isGenerator = text.startsWith("function* ");
  var isGeneratorShorthand = text.startsWith("*");
  var isBasic = !isGenerator && text.startsWith("function ");
  var isClass = text.startsWith("class ") || text.startsWith("class{");
  var firstArrowIndex = text.indexOf("=>");
  var isArrow =
    !isAsync && !isGenerator && !isBasic && !isClass && firstArrowIndex > 0;
  // TODO: should default name be fixed?
  var defaultName = "";

  var textAfterPrefix;
  if (isClass) {
    // class A {} -> class A
    textAfterPrefix = text.substring("class".length);
    var classNameMatch = /^[^{\s]+/.exec(textAfterPrefix.trim());
    var className = defaultName;
    if (classNameMatch) className = classNameMatch[0].trim() || defaultName;
    return inspectFunction("class", textAfterPrefix, className);
  } else if (isAsync) {
    // async function a() {} -> async ƒ a()
    textAfterPrefix = text.substring("async function".length);
    return inspectFunction(
      "async ƒ",
      textAfterPrefix,
      nameAndArguments(textAfterPrefix)
    );
  } else if (isGenerator) {
    // function a*() {} -> ƒ* a()
    textAfterPrefix = text.substring("function*".length);
    return inspectFunction(
      "ƒ*",
      textAfterPrefix,
      nameAndArguments(textAfterPrefix)
    );
  } else if (isGeneratorShorthand) {
    textAfterPrefix = text.substring("*".length);
    return inspectFunction(
      "ƒ*",
      textAfterPrefix,
      nameAndArguments(textAfterPrefix)
    );
  } else if (isBasic) {
    // function a() {} -> ƒ a()
    textAfterPrefix = text.substring("function".length);
    return inspectFunction(
      "ƒ",
      textAfterPrefix,
      nameAndArguments(textAfterPrefix)
    );
  } else if (isArrow) {
    // () => {return 1} -> () => {return 1}
    const maxArrowFunctionCharacterLength = 60;
    var abbreviation = text;
    if (defaultName) abbreviation = defaultName + "()";
    else if (text.length > maxArrowFunctionCharacterLength)
      // () => {return 1} -> () => {…}
      abbreviation = text.substring(0, firstArrowIndex + 2) + " {\u2026}";
    return inspectFunction("", text, abbreviation);
  } else {
    // () => {return 1} -> () => {return 1}
    return inspectFunction("ƒ", text, nameAndArguments(text));
  }
}

function nameAndArguments(contents) {
  var defaultName = "";
  var startOfArgumentsIndex = contents.indexOf("(");
  var endOfArgumentsMatch = contents.match(/\)\s*{/);
  if (
    startOfArgumentsIndex !== -1 &&
    endOfArgumentsMatch &&
    endOfArgumentsMatch.index > startOfArgumentsIndex
  ) {
    var name =
      contents.substring(0, startOfArgumentsIndex).trim() || defaultName;
    var args = contents.substring(
      startOfArgumentsIndex,
      endOfArgumentsMatch.index + 1
    );
    return name + args;
  }
  return defaultName + "()";
}

// TODO Optionally show body?
function inspectFunction(prefix, body, abbreviation) {
  var span = document.createElement("span");
  span.className = "d3--function";
  if (prefix) {
    var spanPrefix = span.appendChild(document.createElement("span"));
    spanPrefix.className = "d3--keyword";
    spanPrefix.textContent = prefix;
    span.appendChild(document.createTextNode(" "));
  }
  span.appendChild(document.createTextNode(abbreviation.replace(/\n/, " ")));
  return span;
}
