import input from "../stdlib/generators/input";
import {variable_define} from "./define";

export default function(name, inputs, definition) {
  this.define("viewof " + name, inputs, definition);
  var value = this._module.variable();
  variable_define.call(value, name, [this], input);
  this._imports = [value];
  return this;
}
