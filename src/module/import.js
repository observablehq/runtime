import variable_import from "../variable/import";

export default function module_import() {
  return variable_import.apply(this.variable(), arguments);
}
