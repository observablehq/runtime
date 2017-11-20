import generatorish from "../generatorish";
import noop from "../noop";
import variable_displayError from "../variable/displayError";
import variable_displayValue from "../variable/displayValue";
import variable_increment from "../variable/increment";
import variable_reachable from "../variable/reachable";
import variable_value from "../variable/value";

export default function compute() {
  if (this._computing) return;
  this._computing = requestAnimationFrame(runtime_compute.bind(this));
}

function runtime_compute() {
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
    if (variable._indegree === 0) {
      queue.push(variable);
    }
  });

  // Compute the variables in topological order.
  while (variable = queue.pop()) {
    if (variable._reachable) variable_compute(variable).catch(noop);
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

function variable_compute(variable) {
  if (variable._generator) {
    variable._generator.return();
    variable._generator = null;
  }
  if (variable._node) {
    variable._node.classList.add("O--running");
  }
  var valuePrior = variable._valuePrior;
  return variable._value = Promise.all(variable._inputs.map(variable_value)).then(function(inputs) {
    if (!variable._definition) throw new ReferenceError(variable._name + " is not defined");
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
