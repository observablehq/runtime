export default function Cell(main, id, node) {
  if (!node) node = document.createElement("div");
  Object.defineProperties(this, {
    _id: {value: id},
    _node: {value: node},
    _error: {value: undefined, writable: true},
    _variable: {value: main.variable(node)},
    _loaded: {value: false, writable: true},
    _view: {value: null, writable: true},
    _imports: {value: null, writable: true},
  });
}
