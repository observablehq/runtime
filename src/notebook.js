import Cell from "./cell";
import Runtime from "./runtime";

export default function Notebook(builtins) {
  var runtime = new Runtime(builtins);
  Object.defineProperties(this, {
    _runtime: {value: runtime},
    _main: {value: runtime.module()},
    _modules: {value: new Map()}
  });
}

Object.defineProperties(Notebook.prototype, {
  _module: {value: notebook_module, writable: true, configurable: true},
  cell: {value: notebook_cell, writable: true, configurable: true}
});

function notebook_module(id) {
  let module = this._modules.get(id);
  if (!module) this._modules.set(id, module = this.module());
  return module;
}

function notebook_cell(node) {
  if (typeof node === "string") node = document.querySelector(node);
  return new Cell(this, node);
}
