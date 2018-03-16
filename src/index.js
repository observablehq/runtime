export {default as runtime} from "./runtime";
export {RuntimeError} from "./errors";

export function load(stdlib, notebook) {
  const runtime = runtime(stdlib);
  const module = runtime.module();
  notebook.cells.forEach(cell => {
    const variable = module.variable();
    variable.define(cell.name, cell.inputs, cell.definition);
  });
  return runtime;
}
