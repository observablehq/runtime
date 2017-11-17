import variable_define from "../variable/define";

export default function module_define() {
  return variable_define.apply(this.variable(), arguments);
}
