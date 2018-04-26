export {RuntimeError} from "./errors";
import {default as Library} from "./library";
export {default as Notebook} from "./notebook";
import {default as Runtime} from "./runtime";
export {Library, Runtime};

export function load(notebookModule, nodes = {}) {
  const {modules} = notebookModule;
  const runtime = new Runtime(new Library());
  const moduleMap = new Map();

  modules.forEach(m =>  moduleMap.set(m.id, runtime.module()));

  modules.forEach(m => {
    const module = moduleMap.get(m.id);
    m.variables.forEach(v => {
      const node = m.id === "__main__" ? nodes[v.name] : null;
      const variable = module.variable(node);
      if (v.from) {
        variable.import(v.name, v.remote, moduleMap.get(v.from));
      } else {
        variable.define(v.name, v.inputs, v.value);
      }
    });
  });
}
