import {runtimeLibrary} from "@observablehq/notebook-stdlib";
import Mutable from "./mutable";
import {default as runtime} from "./runtime";
export {RuntimeError} from "./errors";
export {runtime, runtimeLibrary, Mutable};

const library = runtimeLibrary();
const {input, observe} = library.Generators;

export function standardRuntime() {
  return runtime(library);
}

export function load(notebook) {
  const modules = new Map();
  const runtime = standardRuntime();
  notebook.modules.forEach(m => {
    const module = runtime.module();
    modules.set(m.name, module);
    m.cells.forEach(cell => define(module, cell));
  });
  return runtime;
}

function define(module, cell) {
  if (cell.imports) {
    // TK Import
  } else if (cell.view) {
    const reference = `viewof ${cell.name}`;
    module.variable().define(cell.name, [reference], input);
    module.variable().define(reference, cell.inputs, cell.definition);
  } else if (cell.mutable) {
    let change;
    const reference = `mutable ${cell.name}`;
    module.variable().define(cell.name, [reference], observe(_ => (change = _)));
    module.variable().define(reference, cell.inputs, () => new Mutable(change, cell.definition.apply(this, arguments)));
  } else {
    module.variable().define(cell.name, cell.inputs, cell.definition);
  }
}
