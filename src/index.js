import {runtimeLibrary} from "@observablehq/notebook-stdlib";
import {default as runtime} from "./runtime";
export {RuntimeError} from "./errors";
export {runtime, runtimeLibrary};

export function standardRuntime() {
  return runtime(runtimeLibrary());
}

export function load(stdlib, notebook) {
  const runtime = standardRuntime();
  const module = runtime.module();
  notebook.cells.forEach(cell => {
    const variable = module.variable();
    variable.define(cell.name, cell.inputs, cell.definition);
  });
  return runtime;
}
