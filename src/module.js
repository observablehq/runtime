import {forEach} from "./array";
import constant from "./constant";
import {RuntimeError} from "./errors";
import identity from "./identity";
import rethrow from "./rethrow";
import {variable_invalidation, variable_visibility} from "./runtime";
import Variable, {TYPE_DUPLICATE, TYPE_IMPLICIT, TYPE_NORMAL, no_observer} from "./variable";

export default function Module(runtime, builtins = []) {
  Object.defineProperties(this, {
    _runtime: {value: runtime},
    _scope: {value: new Map},
    _builtins: {value: new Map([
      ["invalidation", variable_invalidation],
      ["visibility", variable_visibility],
      ...builtins
    ])},
    _source: {value: null, writable: true}
  });
}

Object.defineProperties(Module.prototype, {
  _copy: {value: module_copy, writable: true, configurable: true},
  _resolve: {value: module_resolve, writable: true, configurable: true},
  redefine: {value: module_redefine, writable: true, configurable: true},
  define: {value: module_define, writable: true, configurable: true},
  derive: {value: module_derive, writable: true, configurable: true},
  import: {value: module_import, writable: true, configurable: true},
  value: {value: module_value, writable: true, configurable: true},
  variable: {value: module_variable, writable: true, configurable: true},
  builtin: {value: module_builtin, writable: true, configurable: true}
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

async function module_value(name) {
  var v = this._scope.get(name);
  if (!v) throw new RuntimeError(name + " is not defined");
  if (v._observer === no_observer) {
    v._observer = true;
    this._runtime._dirty.add(v);
  }
  await this._runtime._compute();
  return v._promise;
}

function module_derive(injects, injectModule) {
  var copy = new Module(this._runtime, this._builtins);
  copy._source = this;
  forEach.call(injects, function(inject) {
    if (typeof inject !== "object") inject = {name: inject + ""};
    if (inject.alias == null) inject.alias = inject.name;
    copy.import(inject.name, inject.alias, injectModule);
  });
  Promise.resolve().then(() => {
    const modules = new Set([this]);
    for (const module of modules) {
      for (const variable of module._scope.values()) {
        if (variable._definition === identity) { // import
          const module = variable._inputs[0]._module;
          const source = module._source || module;
          if (source === this) { // circular import-with!
            console.warn("circular module definition; ignoring"); // eslint-disable-line no-console
            return;
          }
          modules.add(source);
        }
      }
    }
    this._copy(copy, new Map);
  });
  return copy;
}

function module_copy(copy, map) {
  copy._source = this;
  map.set(this, copy);
  for (const [name, source] of this._scope) {
    var target = copy._scope.get(name);
    if (target && target._type === TYPE_NORMAL) continue; // injection
    if (source._definition === identity) { // import
      var sourceInput = source._inputs[0],
          sourceModule = sourceInput._module;
      copy.import(sourceInput._name, name, map.get(sourceModule)
        || (sourceModule._source
           ? sourceModule._copy(new Module(copy._runtime, copy._builtins), map) // import-with
           : sourceModule));
    } else {
      copy.define(name, source._inputs.map(variable_name), source._definition);
    }
  }
  return copy;
}

function module_resolve(name) {
  var variable = this._scope.get(name), value;
  if (!variable) {
    variable = new Variable(TYPE_IMPLICIT, this);
    if (this._builtins.has(name)) {
      variable.define(name, constant(this._builtins.get(name)));
    } else if (this._runtime._builtin._scope.has(name)) {
      variable.import(name, this._runtime._builtin);
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

function module_builtin(name, value) {
  this._builtins.set(name, value);
}

function variable_name(variable) {
  return variable._name;
}
