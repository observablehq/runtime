import {forEach} from "../array";
import identity from "../identity";
import Variable from "../variable/index";
import Module from "./index";

var none = new Map;

export default function(injects, injectModule) {
  var injectByAlias = new Map;
  forEach.call(injects, function(inject) {
    if (typeof inject !== "object") inject = {name: inject + ""};
    if (inject.alias == null) inject.alias = inject.name;
    injectByAlias.set(inject.alias, inject);
  });
  return module_copy(this, injectByAlias, injectModule, new Map);
}

function module_copy(module, injectByAlias, injectModule, map) {
  var copy = new Module(module._runtime);
  map.set(module, copy);
  module._scope.forEach(function(source, name) {
    var target = new Variable(copy), inject;
    if (inject = injectByAlias.get(name)) {
      target.import(inject.name, inject.alias, injectModule);
    } else if (source._definition === identity) { // import!
      var sourceInput = source._inputs[0],
          sourceModule = sourceInput._module,
          targetModule = map.get(sourceModule) || module_copy(sourceModule, none, null, map);
      target.import(sourceInput._name, name, targetModule);
    } else {
      target.define(name, source._inputs.map(input_name), source._definition);
    }
  });
  return copy;
}

function input_name(input) {
  return input._name;
}
