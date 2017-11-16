import variable_define from "./define";
import variable_delete from "./delete";
import variable_import from "./import";

export default function Variable(module, node) {
  this._module = module;
  this._id = null; // TODO Better indication of undefined variables?
  this._name = null;
  this._inputs = [];
  this._outputs = new Set;
  this._indegree = 0; // The number of computing inputs.
  this._reachable = node != null; // Is this variable transitively visible?
  this._definition = undefined;
  this._valuePrior = undefined; // TODO Rename to the “resolved” value?
  this._value = undefined;
  this._generator = undefined;
  this._duplicate = false;
  this._duplicates = undefined;
  this._node = node;
}

Variable.prototype.define = variable_define;
Variable.prototype.delete = variable_delete;
Variable.prototype.import = variable_import;
