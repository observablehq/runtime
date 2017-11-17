import module_derive from "./derive";
import module_define from "./define";
import module_import from "./import";
import module_variable from "./variable";

export default function Module(runtime, weak) {
  this._runtime = runtime;
  this._scope = new Map;
  this._weak = weak;
}

Module.prototype.derive = module_derive;
Module.prototype.define = module_define;
Module.prototype.import = module_import;
Module.prototype.variable = module_variable;
