import dispatch from "./dispatch";
import inspect from "./inspect/index";
import generatorish from "./generatorish";
import Module from "./module";
import noop from "./noop";
import stdlib from "./stdlib/index";
import Variable, {TYPE_IMPLICIT} from "./variable";

class ResolutionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResolutionError";
  }
}

export default function(builtins) {
  if (builtins == null) builtins = stdlib();
  return new Runtime(builtins);
}

function Runtime(builtins) {
  var module = this.module();
  Object.defineProperties(this, {
    _dirty: {value: new Set},
    _updates: {value: new Set},
    _computing: {value: null, writable: true},
    _builtin: {value: module}
  });
  if (builtins) for (var name in builtins) {
    var builtin = new Variable(TYPE_IMPLICIT, module);
    builtin.define(name, [], builtins[name]);
  }
}

Object.defineProperties(Runtime.prototype, {
  _compute: {value: runtime_compute, writable: true, configurable: true},
  module: {value: runtime_module, writable: true, configurable: true}
});

function runtime_module() {
  return new Module(this);
}

function runtime_compute() {
  if (this._computing) return;
  this._computing = requestAnimationFrame(runtime_computeNow.bind(this));
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
    } else if (reachable < variable._reachable && variable._generator) {
      variable._generator.return();
      variable._generator = undefined;
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
    variable_compute(variable).catch(noop);
    variable._outputs.forEach(postqueue);
    variables.delete(variable);
  }

  // Any remaining variables have circular definitions.
  variables.forEach(function(variable) {
    var error = new ReferenceError("circular definition");
    variable._valuePrior = undefined;
    (variable._value = Promise.reject(error)).catch(noop);
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
  return variable._value;
}

function variable_compute(variable) {
  if (variable._generator) {
    variable._generator.return();
    variable._generator = null;
  }
  if (variable._node) {
    variable._node.classList.add("O--running");
  }
  var valuePrior = variable._valuePrior;
  return variable._value = Promise.all(variable._inputs.map(function(input) {
      var val = variable_value(input);
      if (!input._definition) return Promise.reject(new ReferenceError(input._name + " is not defined"));
      return val.catch(function(){ throw new ResolutionError("Error in definition of " + input._name); });
    })).then(function(inputs) {
    var value = variable._definition.apply(valuePrior, inputs);
    if (generatorish(value)) {
      var generator = variable._generator = value, next = generator.next();
      return next.done ? undefined : Promise.resolve(next.value).then(function(value) {
        variable_recompute(variable, generator);
        return value;
      });
    }
    return value;
  }).then(function(value) {
    variable._valuePrior = value;
    variable_displayValue(variable, value);
    return value;
  }, function(error) {
    variable._valuePrior = undefined;
    variable_displayError(variable, error);
    throw error;
  });
}

function variable_recompute(variable, generator) {
  requestAnimationFrame(function poll() {
    var next;
    try {
      next = generator.next();
      if (next.done) return;
      next = Promise.resolve(next.value);
    } catch (error) {
      next = Promise.reject(error);
    }
    next.then(function(nextValue) {
      variable_postrecompute(variable, nextValue, next);
      variable_displayValue(variable, nextValue);
      requestAnimationFrame(poll);
      return nextValue;
    }, function(error) {
      variable_postrecompute(variable, undefined, next);
      variable_displayError(variable, error);
      throw error;
    });
  });
}

function variable_postrecompute(variable, valuePrior, value) {
  var runtime = variable._module._runtime;
  variable._valuePrior = valuePrior;
  variable._value = value;
  variable._outputs.forEach(runtime._updates.add, runtime._updates); // TODO Cleaner?
  runtime._compute();
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
  node.textContent = error + ""; // TODO Pretty stack trace.
  dispatch(node, "error", {error});
}

function variable_displayValue(variable, value) {
  var node = variable._node;
  if (!node) return;
  if ((value instanceof Element || value instanceof Text) && (!value.parentNode || value.parentNode === node)) {
    node.className = "O";
  } else {
    node.className = "O O--inspect";
    value = inspect(value, false, node.firstChild // TODO Do this better.
        && node.firstChild.classList
        && node.firstChild.classList.contains("O--expanded"));
  }
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
