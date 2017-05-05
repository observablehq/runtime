import {constant_true} from "../constant";
import identity from "../identity";
import module_resolve from "../module/resolve";
import {variable_define} from "./define";
import Variable from "./index";

export default function(module, specifiers) {
  variable_define.call(this, null, [], constant_true);
  this._imports = specifiers.map(function(specifier) {
    if (typeof specifier !== "object") specifier += "", specifier = {member: specifier, alias: specifier};
    else if (specifier.alias == null) specifier.alias = specifier.member;
    var variable = new Variable(this._module);
    variable._id = null; // TODO Cleaner?
    return variable_define.call(variable, specifier.alias, [module_resolve.call(module, specifier.member)], identity);
  }, this);
  this._runtime._compute();
  return this;
}
