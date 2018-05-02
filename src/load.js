import Runtime from "./runtime";
import noop from "./noop";

export default function load(library, {modules, id}, outputs = noop) {
  const map = new Map;
  const runtime = new Runtime(library);
  const main = runtime_module(id);

  function runtime_module(id) {
    let module = map.get(id);
    if (!module) map.set(id, module = runtime.module());
    return module;
  }

  for (const m of modules) {
    const module = runtime_module(m.id);
    let i = -1;
    for (const v of m.variables) {
      const variable = module.variable(module === main ? outputs(v, ++i, m.variables) : null);
      if (v.from) variable.import(v.remote, v.name, runtime_module(v.from));
      else variable.define(v.name, v.inputs, v.value);
    }
  }

  return runtime;
}
