export {RuntimeError} from "./errors";
import {default as Library, Mutable} from "./library";
export {default as Notebook} from "./notebook";
import {default as Runtime} from "./runtime";
export {Library, Runtime};

export function load(notebook, nodes = {}) {
  const {modules} = notebook;
  const library = new Library();
  const runtime = new Runtime(library);
  const moduleMap = new Map();
  const {Generators: {input}} = library;

  modules.forEach(m =>  moduleMap.set(m.id, runtime.module()));

  modules.forEach(m => {
    const module = moduleMap.get(m.id);

    function module_variable(name) {
      const node = m.id === notebook.id ? nodes[name] : null;
      return module.variable(node);
    }

    m.variables.forEach(v => {
      if (v.view) {
        const reference = `viewof ${v.name}`;
        module_variable(reference).define(reference, v.inputs, v.value);
        module_variable(v.name).define(v.name, [reference], input);
      } else if (v.mutable) {
        const reference = `mutable ${v.name}`;
        module_variable(reference).define(reference, v.inputs, Mutable.value(v.value));
        module_variable(v.name).define(v.name, [reference], mutable => mutable.generator);
      } else {
        const variable = module_variable(v.name);
        if (v.from) {
          variable.import(v.name, v.remote, moduleMap.get(v.from));
        } else {
          variable.define(v.name, v.inputs, v.value);
        }
      }
    });
  });
}
