import variable_define from "./define";
import variable_delete from "./delete";

export default function Variable(runtime, moduleId, node) {
  this._runtime = runtime;
  this._moduleId = moduleId; // TODO Should moduleId be part of the name?
  this._id = -1; // TODO Better indication of undefined variables?
  this._name = null;
  this._inputs = [];
  this._outputs = new Set;
  this._indegree = 0; // The number of computing inputs.
  this._outdegree = node == null ? 0 : 1; // The number of visible outputs.
  // TODO this._exdegree = 0; // The number of defining variables (an import or a view).
  this._definition = undefined;
  this._valuePrior = undefined; // TODO Rename to the “resolved” value?
  this._value = undefined;
  this._generator = undefined;
  this._duplicate = false;
  this._duplicates = undefined;
  this._node = node;
  // TODO this._imports
  // TODO this._timeout
  // TODO this._height
}

Variable.prototype.define = variable_define;
Variable.prototype.delete = variable_delete;
