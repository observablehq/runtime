import Library from "@observablehq/notebook-stdlib";
import Cell from "./cell";
import dispatch from "./dispatch";
import inspect from "./inspect/index";
import {RuntimeError} from "./errors";
import generatorish from "./generatorish";
import Module from "./module";
import noop from "./noop";
import Variable, {TYPE_IMPLICIT, variable_invalidate} from "./variable";

const library = new Library();

export default function Runtime(builtins, mainId) {
  if (builtins == null) builtins = library;
  if (mainId == null) mainId = "main";
  var builtin = this.module();
  var main = this.module();
  var modules = new Map();
  modules.set(mainId, main);
  Object.defineProperties(this, {
    _dirty: {value: new Set},
    _updates: {value: new Set},
    _computing: {value: null, writable: true},
    _builtin: {value: builtin},
    main: {value: main},
    modules: {value: modules},
  });
  if (builtins) for (var name in builtins) {
    (new Variable(TYPE_IMPLICIT, builtin)).define(name, [], builtins[name]);
  }
}

Object.defineProperties(Runtime.prototype, {
  _compute: {value: runtime_compute, writable: true, configurable: true},
  _computeSoon: {value: runtime_computeSoon, writable: true, configurable: true},
  _computeNow: {value: runtime_computeNow, writable: true, configurable: true},
  module: {value: runtime_module, writable: false},
  cell: {value: cell_declare, writable: false}
});

var LOCATION_MATCH = /\s+\(\d+:\d+\)$/m;

function runtime_module(id) {
  if (id) {
    let module = this.modules.get(id);
    if (!module) this.modules.set(id, (module = this.module()));
    return module;
  } else {
    return new Module(this);
  }
}

function runtime_compute() {
  return this._computing || (this._computing = this._computeSoon());
}

function runtime_computeSoon() {
  var runtime = this;
  return new Promise(function(resolve) {
    requestAnimationFrame(function() {
      resolve();
      runtime._computeNow();
    });
  });
}

function runtime_computeNow() {
  var queue = [],
      variables,
      variable;

  // Compute the reachability of the transitive closure of dirty variables.
  // Any newly-reachable variable must also be recomputed.
  // Any no-longer-reachable variable must be terminated.
  variables = new Set(this._dirty);
  variables.forEach(function(variable) {
    variable._inputs.forEach(variables.add, variables);
    const reachable = variable_reachable(variable);
    if (reachable > variable._reachable) {
      this._updates.add(variable);
    } else if (reachable < variable._reachable) {
      variable._invalidate();
    }
    variable._reachable = reachable;
  }, this);

  // Compute the transitive closure of updating variables.
  variables = new Set(this._updates);
  variables.forEach(function(variable) {
    variable._indegree = 0;
    variable._outputs.forEach(variables.add, variables);
  });

  this._computing = null;
  this._updates.clear();
  this._dirty.clear();

  // Compute the indegree of updating variables.
  variables.forEach(function(variable) {
    variable._outputs.forEach(variable_increment);
  });

  // Identify the root variables (those with no updating inputs).
  variables.forEach(function(variable) {
    if (!variable._reachable) variables.delete(variable);
    else if (variable._indegree === 0) queue.push(variable);
  });

  // Compute the variables in topological order.
  while (variable = queue.pop()) {
    variable_compute(variable);
    variable._outputs.forEach(postqueue);
    variables.delete(variable);
  }

  // Any remaining variables have circular definitions.
  variables.forEach(function(variable) {
    var error = new RuntimeError("circular definition");
    variable._value = undefined;
    (variable._promise = Promise.reject(error)).catch(noop);
    variable_displayError(variable, error);
  });

  function postqueue(variable) {
    --variable._indegree || queue.push(variable);
  }
}

function variable_increment(variable) {
  ++variable._indegree;
}

function variable_value(variable) {
  return variable._promise.catch(variable._rejector);
}

function variable_invalidator(variable) {
  return new Promise(function(resolve) {
    variable._invalidate = resolve;
  });
}

function variable_compute(variable) {
  variable._invalidate();
  variable._invalidate = noop;
  if (variable._node) variable._node.classList.add("O--running");
  var value0 = variable._value,
      version = ++variable._version,
      promise = variable._promise = Promise.all(variable._inputs.map(variable_value)).then(function(inputs) {
    if (variable._version !== version) return;

    // Replace any reference to invalidation with the promise, lazily.
    for (var i = 0, n = inputs.length, invalidate = null; i < n; ++i) {
      if (inputs[i] === variable_invalidate) {
        inputs[i] = invalidate = variable_invalidator(variable);
        break;
      }
    }

    // Compute the initial value of the variable.
    // If the value is a generator, then retrieve its first value,
    // and dispose of the generator if the variable is invalidated.
    var value = variable._definition.apply(value0, inputs);
    if (generatorish(value)) {
      (invalidate || variable_invalidator(variable)).then(variable_return(value));
      return variable_precompute(variable, version, promise, value);
    }

    return value;
  });
  promise.then(function(value) {
    if (variable._version !== version) return;
    variable._value = value;
    variable_displayValue(variable, value);
  }, function(error) {
    if (variable._version !== version) return;
    variable._value = undefined;
    variable_displayError(variable, error);
  });
}

function variable_precompute(variable, version, promise, generator) {
  function recompute() {
    var promise = new Promise(function(resolve) {
      resolve(generator.next());
    }).then(function(next) {
      return next.done ? undefined : Promise.resolve(next.value).then(function(value) {
        if (variable._version !== version) return;
        variable_postrecompute(variable, value, promise).then(recompute);
        variable_displayValue(variable, value);
        return value;
      });
    });
    promise.catch(function(error) {
      if (variable._version !== version) return;
      variable_postrecompute(variable, undefined, promise);
      variable_displayError(variable, error);
    });
  }
  return new Promise(function(resolve) {
    resolve(generator.next());
  }).then(function(next) {
    if (next.done) return;
    promise.then(recompute);
    return Promise.resolve(next.value);
  });
}

function variable_postrecompute(variable, value, promise) {
  var runtime = variable._module._runtime;
  variable._value = value;
  variable._promise = promise;
  variable._outputs.forEach(runtime._updates.add, runtime._updates); // TODO Cleaner?
  return runtime._compute();
}

function variable_return(generator) {
  return function() {
    generator.return();
  };
}

function variable_reachable(variable) {
  if (variable._node) return true; // Directly reachable.
  var outputs = new Set(variable._outputs);
  for (const output of outputs) {
    if (output._node) return true;
    output._outputs.forEach(outputs.add, outputs);
  }
  return false;
}

function variable_displayError(variable, error) {
  var node = variable._node;
  if (!node) return;
  node.className = "O O--error";
  while (node.lastChild) node.removeChild(node.lastChild);
  var span = document.createElement("span");
  span.className = "O--inspect";
  span.textContent = (error + "").replace(LOCATION_MATCH, "");
  node.appendChild(span);
  dispatch(node, "error", {error: error});
}

function variable_displayValue(variable, value) {
  var node = variable._node;
  if (!node) return;
  if (!(value instanceof Element || value instanceof Text) || (value.parentNode && value.parentNode !== node)) {
    value = inspect(value, false, node.firstChild // TODO Do this better.
        && node.firstChild.classList
        && node.firstChild.classList.contains("O--expanded"));
    value.classList.add("O--inspect");
  }
  node.className = "O";
  if (node.firstChild !== value) {
    if (node.firstChild) {
      while (node.lastChild !== node.firstChild) node.removeChild(node.lastChild);
      node.replaceChild(value, node.firstChild);
    } else {
      node.appendChild(value);
    }
  }
  dispatch(node, "update");
}

function cell_declare(node) {
  if (typeof node === "string") node = document.querySelector(node);
  return new Cell(this, node);
}
