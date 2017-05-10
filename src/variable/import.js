import identity from "../identity";
import module_resolve from "../module/resolve";
import {variable_define} from "./define";

export default function(name, alias, module) {
  if (arguments.length < 3) module = alias, alias = name;
  return variable_define.call(this, alias + "", [module_resolve.call(module, name + "")], identity);
}
