import noop from "../../noop";

export default function(initialize) {
  var queue = [], resolve, finalize = initialize(push);

  function push(x) {
    queue.push(x);
    if (resolve) resolve(queue.shift()), resolve = null;
    return x;
  }

  function next() {
    return {done: false, value: queue.length
        ? Promise.resolve(queue.shift())
        : new Promise(function(_) { resolve = _; })};
  }

  return {
    throw: noop,
    return: finalize == null ? noop : finalize,
    next: next
  };
}
