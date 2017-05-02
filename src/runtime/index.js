import runtime_compute from "./compute";
import runtime_module from "./module";

export default function() {
  return new Runtime;
}

function Runtime() {
  this._updates = new Set;
  this._computing = null;
}

Runtime.prototype._compute = runtime_compute;
Runtime.prototype.module = runtime_module;
