import {forEach} from "./array";
import constant from "./constant";
import {RuntimeError} from "./errors";
import identity from "./identity";
import rethrow from "./rethrow";
import {variable_invalidation, variable_visibility} from "./runtime";
import Variable, {TYPE_DUPLICATE, TYPE_IMPLICIT, TYPE_NORMAL, no_observer} from "./variable";

var none = new Map;

export default function Module(runtime) {
  Object.defineProperties(this, {
    _runtime: {value: runtime},
    _scope: {value: new Map}
  });
}

Object.defineProperties(Module.prototype, {
  _copy: {value: module_copy, writable: true, configurable: true},
  _resolve: {value: module_resolve, writable: true, configurable: true},
  redefine: {value: module_redefine, writable: true, configurable: true},
  define: {value: module_define, writable: true, configurable: true},
  derive: {value: module_derive, writable: true, configurable: true},
  evaluate: {value: module_evaluate, writable: true, configurable: true},
  import: {value: module_import, writable: true, configurable: true},
  variable: {value: module_variable, writable: true, configurable: true}
});

function module_redefine(name) {
  var v = this._scope.get(name);
  if (!v) throw new RuntimeError(name + " is not defined");
  if (v._type === TYPE_DUPLICATE) throw new RuntimeError(name + " is defined more than once");
  return v.define.apply(v, arguments);
}

function module_define() {
  var v = new Variable(TYPE_NORMAL, this);
  return v.define.apply(v, arguments);
}

function module_import() {
  var v = new Variable(TYPE_NORMAL, this);
  return v.import.apply(v, arguments);
}

function module_variable(observer) {
  return new Variable(TYPE_NORMAL, this, observer);
}

function module_evaluate(name) {
  var v = this._scope.get(name);
  if (!v) throw new RuntimeError(name + " is not defined");
  if (v._observer === no_observer) {
    v._observer = true;
    this._runtime._dirty.add(v);
  }
  return this._runtime._compute().then(() => v._promise);
}

function module_derive(injects, injectModule) {
  var injectByAlias = new Map;
  forEach.call(injects, function(inject) {
    if (typeof inject !== "object") inject = {name: inject + ""};
    if (inject.alias == null) inject.alias = inject.name;
    injectByAlias.set(inject.alias, inject);
  });
  return this._copy(injectByAlias, injectModule, new Map);
}

function module_copy(injectByAlias, injectModule, map) {
  var copy = new Module(this._runtime);
  map.set(this, copy);
  this._scope.forEach(function(source, name) {
    var target = new Variable(source._type, copy), inject;
    if (inject = injectByAlias.get(name)) {
      target.import(inject.name, inject.alias, injectModule);
    } else if (source._definition === identity) { // import!
      var sourceInput = source._inputs[0],
          sourceModule = sourceInput._module,
          targetModule = map.get(sourceModule) || sourceModule._copy(none, null, map);
      target.import(sourceInput._name, name, targetModule);
    } else {
      target.define(name, source._inputs.map(variable_name), source._definition);
    }
  });
  return copy;
}

function module_resolve(name) {
  var variable = this._scope.get(name), value;
  if (!variable)  {
    variable = new Variable(TYPE_IMPLICIT, this);
    if (this._runtime._builtin._scope.has(name)) {
      variable.import(name, this._runtime._builtin);
    } else if (name === "invalidation") {
      variable.define(name, variable_invalidation);
    } else if (name === "visibility") {
      variable.define(name, variable_visibility);
    } else {
      try {
        value = this._runtime._global(name);
      } catch (error) {
        return variable.define(name, rethrow(error));
      }
      if (value === undefined) {
        this._scope.set(variable._name = name, variable);
      } else {
        variable.define(name, constant(value));
      }
    }
  }
  return variable;
}

function variable_name(variable) {
  return variable._name;
}
