import {map} from "./array";
import constant from "./constant";
import identity from "./identity";

export default function Variable(module, node) {
  Object.defineProperties(this, {
    _definition: {value: undefined, writable: true},
    _duplicate: {value: undefined, writable: true},
    _duplicates: {value: undefined, writable: true},
    _generator: {value: undefined, writable: true},
    _id: {value: null, writable: true}, // TODO Better indication of undefined variables?
    _indegree: {value: 0, writable: true}, // The number of computing inputs.
    _inputs: {value: [], writable: true},
    _module: {value: module},
    _name: {value: null, writable: true},
    _node: {value: node},
    _outputs: {value: new Set, writable: true},
    _reachable: {value: node != null, writable: true}, // Is this variable transitively visible?
    _value: {value: undefined, writable: true},
    _valuePrior: {value: undefined, writable: true} // TODO Rename to the “resolved” value?
  });
}

Object.defineProperties(Variable.prototype, {
  define: {value: variable_define, writable: true, configurable: true},
  delete: {value: variable_delete, writable: true, configurable: true},
  import: {value: variable_import, writable: true, configurable: true}
});

function variable_attach(variable) {
  variable._module._runtime._dirty.add(variable);
  variable._outputs.add(this);
}

function variable_detach(variable) {
  variable._module._runtime._dirty.add(variable);
  variable._outputs.delete(this);
}

function variable_builtin(name) {
  return function() {
    throw new ReferenceError(name + " is a builtin");
  };
}

function variable_duplicate(name) {
  return function() {
    throw new ReferenceError(name + " is defined more than once");
  };
}

function variable_define(name, inputs, definition) {
  switch (arguments.length) {
    case 1: {
      definition = name, name = inputs = null;
      break;
    }
    case 2: {
      definition = inputs;
      if (typeof name === "string") inputs = null;
      else inputs = name, name = null;
      break;
    }
  }
  return variable_defineImpl.call(this,
    name == null ? null : name + "",
    inputs == null ? [] : map.call(inputs, this._module._resolve, this._module),
    typeof definition === "function" ? definition : constant(definition)
  );
}

function variable_defineImpl(name, inputs, definition) {
  var scope = this._module._scope, runtime = this._module._runtime;

  // Disallow variables to override builtins.
  if (runtime._scope.has(name)) definition = variable_builtin(name), name = null;

  this._value = this._valuePrior = undefined;
  if (this._generator) this._generator.return(), this._generator = undefined;
  this._inputs.forEach(variable_detach, this);
  inputs.forEach(variable_attach, this);
  this._inputs = inputs;
  this._definition = definition;

  // Did the variable’s name change? Time to patch references!
  if (name == this._name && scope.get(name) === this) {
    this._outputs.forEach(runtime._updates.add, runtime._updates);
  } else {
    var error, found;

    if (this._name) { // Did this variable previously have a name?
      if (this._outputs.size) { // And did other variables reference this variable?
        error = new Variable(this._module); // Those references are now broken!
        error._id = -1; // TODO Better indication of undefined variables?
        error._name = this._name;
        error._outputs = this._outputs, this._outputs = new Set;
        error._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(this)] = error; }, this);
        error._outputs.forEach(runtime._updates.add, runtime._updates);
        runtime._dirty.add(error);
        runtime._dirty.add(this);
        scope.set(this._name, error);
      } else if ((found = scope.get(this._name)) === this) { // Do no other variables reference this variable?
        scope.delete(this._name); // It’s safe to delete!
      } else if (found._id === -2) { // Do other variables assign this name?
        found._duplicates.delete(this); // This variable no longer assigns this name.
        this._duplicate = undefined;
        if (found._duplicates.size === 1) { // Is there now only one variable assigning this name?
          found = found._duplicates.keys().next().value; // Any references are now fixed!
          error = scope.get(this._name);
          found._outputs = error._outputs, error._outputs = new Set;
          found._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(error)] = found; });
          found._definition = found._duplicate, found._duplicate = undefined;
          runtime._dirty.add(error);
          runtime._dirty.add(found);
          runtime._updates.add(found);
          scope.set(this._name, found);
        }
      } else {
        throw new Error;
      }
    }

    if (this._outputs.size) throw new Error;

    if (name) { // Does this variable have a new name?
      if (found = scope.get(name)) { // Do other variables reference or assign this name?
        if (found._id === -2) { // Do multiple other variables already define this name?
          this._definition = variable_duplicate(name), this._duplicate = definition;
          found._duplicates.add(this);
        } else if (found._id === -1) { // Are the variable references broken?
          this._outputs = found._outputs, found._outputs = new Set; // Now they’re fixed!
          this._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(found)] = this; }, this);
          runtime._dirty.add(found);
          runtime._dirty.add(this);
          scope.set(name, this);
        } else { // Does another variable define this name?
          found._duplicate = found._definition, this._duplicate = definition; // Now they’re duplicates.
          error = new Variable(this._module);
          error._id = -2; // TODO Better indication of duplicate variables.
          error._name = name;
          error._definition = this._definition = found._definition = variable_duplicate(name);
          error._outputs = found._outputs, found._outputs = new Set;
          error._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(found)] = error; });
          error._duplicates = new Set([this, found]);
          runtime._dirty.add(found);
          runtime._dirty.add(error);
          runtime._updates.add(found).add(error);
          scope.set(name, error);
        }
      } else {
        scope.set(name, this);
      }
    }

    this._name = name;
  }

  runtime._updates.add(this);
  runtime._compute();
  return this;
}

function variable_import(name, alias, module) {
  if (arguments.length < 3) module = alias, alias = name;
  return variable_defineImpl.call(this, alias + "", [module._resolve(name + "")], identity);
}

function variable_delete() {
  this.define(null, [], undefined);
  this._id = -1;
  return this;
}
