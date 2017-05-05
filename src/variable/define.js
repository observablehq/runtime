import module_resolve from "../module/resolve";
import variable_attach from "./attach";
import variable_builtin from "./builtin";
import {variable_delete} from "./delete";
import variable_detach from "./detach";
import variable_duplicate from "./duplicate";
import Variable from "./index";
import variable_outdegree from "./outdegree";

export default function(name, inputs, definition) {
  variable_define.call(this, name, inputs.map(module_resolve, this._module), definition);
  this._runtime._compute();
  return this;
}

export function variable_define(name, inputs, definition) {
  var scope = this._module._scope,
      updates = this._runtime._updates;

  // Disallow variables to override builtins.
  if (this._runtime._scope.has(name)) definition = variable_builtin(name), name = null;

  this._value = this._valuePrior = undefined;
  if (this._generator) this._generator.return(), this._generator = undefined;
  if (this._imports) this._imports.forEach(variable_delete), this._imports = undefined;
  this._inputs.forEach(variable_detach, this);
  this._inputs.forEach(variable_outdegree);
  inputs.forEach(variable_attach, this);
  inputs.forEach(variable_outdegree);
  this._inputs = inputs;
  this._definition = definition;

  // Did the variable’s name change? Time to patch references!
  if (name == this._name && scope.get(name) === this) {
    this._outputs.forEach(updates.add, updates);
  } else {
    var error, found;

    if (this._name) { // Did this variable previously have a name?
      if (this._outputs.size) { // And did other variables reference this variable?
        error = new Variable(this._module); // Those references are now broken!
        error._name = this._name;
        error._outputs = this._outputs, this._outputs = new Set;
        error._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(this)] = error; }, this);
        error._outputs.forEach(updates.add, updates);
        variable_outdegree(error);
        variable_outdegree(this);
        scope.set(this._name, error);
      } else if ((found = scope.get(this._name)) === this) { // Do no other variables reference this variable?
        scope.delete(this._name); // It’s safe to delete!
      } else if (found._id === -2) { // Do other variables assign this name?
        found._duplicates.delete(this); // This variable no longer assigns this name.
        delete this._duplicate;
        if (found._duplicates.size === 1) { // Is there now only one variable assigning this name?
          found = found._duplicates.keys().next().value; // Any references are now fixed!
          error = scope.get(this._name);
          found._outputs = error._outputs, error._outputs = new Set;
          found._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(error)] = found; });
          found._definition = found._duplicate, delete found._duplicate;
          variable_outdegree(error);
          variable_outdegree(found);
          updates.add(found);
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
          variable_outdegree(found);
          variable_outdegree(this);
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
          variable_outdegree(found);
          variable_outdegree(error);
          updates.add(found).add(error);
          scope.set(name, error);
        }
      } else {
        scope.set(name, this);
      }
    }

    this._name = name;
  }

  updates.add(this);
}
