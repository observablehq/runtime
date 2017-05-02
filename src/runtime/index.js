import constant from "../constant";
import runtime_compute from "./compute";
import runtime_module from "./module";

export default function(builtins) {
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
    variable.define(key, [], constant(builtins[key]));
  }
}

Runtime.prototype._compute = runtime_compute;
Runtime.prototype.module = runtime_module;
