import {constant_true} from "../constant";
import identity from "../identity";
import module_resolve from "../module/resolve";
import {variable_define} from "./define";
import Variable from "./index";

export default function(module, imports) {
  variable_define.call(this, null, [], constant_true);
  this._imports = imports.map(function(i) {
    if (typeof i !== "object") i += "", i = {member: i, alias: i};
    else if (!("alias" in i)) i.alias = i.member;
    var variable = new Variable(this._module);
    variable._id = null; // TODO Cleaner?
    return variable_define.call(variable, i.alias, [module_resolve.call(module, i.member)], identity);
  }, this);
  this._runtime._compute();
  return this;
}
