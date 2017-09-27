import stdlib from "../stdlib/index";
import thenable from "../thenable";
import runtime_compute from "./compute";
import runtime_module from "./module";

export default function(builtins) {
  if (builtins == null) builtins = stdlib();
  return new Runtime(builtins);
}

function Runtime(builtins) {
  this._updates = new Set;
  this._computing = null;
  var module = this.module();
  this._scope = module._scope;
  if (builtins) for (var key in builtins) {
    var variable = module.variable();
    variable._id = null; // TODO Cleaner?
    variable._outdegree = NaN; // Prevent recomputation. TODO Cleaner?
    variable._value = thenable(builtins[key]) ? builtins[key] : Promise.resolve(builtins[key]);
    module._scope.set(key, variable);
  }
}

Runtime.prototype._compute = runtime_compute;
Runtime.prototype.module = runtime_module;
