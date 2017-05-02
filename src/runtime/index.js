import runtime_compute from "./compute";
// import runtime_resolve from "./resolve";
import runtime_variable from "./variable";

export default function() {
  return new Runtime;
}

function Runtime() {
  this._scope = new Map;
  this._updates = new Set;
  this._computing = null;
}

Runtime.prototype._compute = runtime_compute;
// TODO? Runtime.prototype._resolve = runtime_resolve;
Runtime.prototype.variable = runtime_variable;
