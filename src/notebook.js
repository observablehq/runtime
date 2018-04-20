import Cell from "./cell";
import {RuntimeError} from "./errors";
import Runtime from "./runtime";
import {defaultLibrary} from "./library";

export default function Notebook(mainId, builtins) {
  if (builtins == null) builtins = defaultLibrary;
  const runtime = new Runtime(builtins);
  const main = runtime.module();
  const modules = new Map().set(mainId == null ? "__main__" : mainId, main);
  const reachable = new Map();
  Object.defineProperties(this, {
    _reachable: {value: reachable},
    _runtime: {value: runtime},
    _main: {value: main},
    _modules: {value: modules}
  });
}

Object.defineProperties(Notebook, {
  load: {value: notebook_load, writable: true, configurable: true}
});

Object.defineProperties(Notebook.prototype, {
  _module: {value: notebook_module, writable: true, configurable: true},
  attach: {value: notebook_attach, writable: true, configurable: true},
  detach: {value: notebook_detach, writable: true, configurable: true},
  cell: {value: notebook_cell, writable: true, configurable: true},
  delete: {value: notebook_delete, writable: true, configurable: true}
});

function notebook_load(definition) {
  const notebook = new Notebook(`${definition.slug}@${definition.version}`);
  definition.cells.forEach(d => notebook.cell().define(d));
  return notebook;
}

function notebook_attach(name, element) {
  const variable = this._reachable.get(name);
  if (!variable) throw new RuntimeError(`cell "${name}" not found`);
  variable.attach(element);
  return this;
}

function notebook_detach(name) {
  const variable = this._reachable.get(name);
  if (!variable) throw new RuntimeError(`cell "${name}" not found`);
  variable.detach();
  return this;
}

function notebook_module(id) {
  let module = this._modules.get(id);
  if (!module) this._modules.set(id, module = this._runtime.module());
  return module;
}

function notebook_cell(node) {
  if (typeof node === "string" && !(node = document.querySelector(node))) throw new Error("node not found");
  return new Cell(this, node);
}

function notebook_delete() {
  this._runtime.stop();
  this._main._scope.forEach(variable => {
    variable.delete();
  });
}
