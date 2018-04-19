export {RuntimeError} from "./errors";
export {default as Library} from "./library";
import {default as _Notebook} from "./notebook";
export {default as Runtime} from "./runtime";
export const Notebook = _Notebook;

export function load(definition, elements) {
  const notebook = new _Notebook(`${definition.slug}@${definition.version}`);
  definition.cells.forEach(cell => {
    if (cell.name in elements) cell.node = elements[cell.name];
    notebook.cell(cell.node).define(cell);
  });
  return notebook;
}
