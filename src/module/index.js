import module_variable from "./variable";

export default function(runtime) {
  return new Module(runtime);
}

function Module(runtime) {
  this._runtime = runtime;
  this._scope = new Map;
}

Module.prototype.variable = module_variable;
