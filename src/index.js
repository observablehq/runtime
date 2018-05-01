import {Library} from "@observablehq/notebook-stdlib";
import {RuntimeError} from "./errors";
import {default as Runtime} from "./runtime";

export {Library, Runtime, RuntimeError};

export function load(notebook, nodes = {}) {
  const {modules} = notebook;
  const library = new Library();
  const runtime = new Runtime(library);
  const moduleMap = new Map();

  modules.forEach(m =>  moduleMap.set(m.id, runtime.module()));

  modules.forEach(m => {
    const module = moduleMap.get(m.id);

    function module_variable(name) {
      let node = m.id === notebook.id ? nodes[name] : null;
      if (typeof node === "string") node = document.querySelector(node);
      return module.variable(node);
    }

    m.variables.forEach(v => {
      const variable = module_variable(v.name);
      if (v.from) {
        const importedModule = moduleMap.get(v.from);
        if (!importedModule) throw new RuntimeError(`unable to load module "${v.from}"`);
        variable.import(v.name, v.remote, importedModule);
      } else {
        variable.define(v.name, v.inputs, v.value);
      }
    });
  });
}
