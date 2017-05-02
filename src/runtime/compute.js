import generatorish from "../generatorish";
import noop from "../noop";
import variable_displayError from "../variable/displayError";
import variable_displayValue from "../variable/displayValue";
import variable_increment from "../variable/increment";
import variable_value from "../variable/value";

export default function compute() {
  if (this._computing) return;
  this._computing = requestAnimationFrame(runtime_compute.bind(this));
}

function runtime_compute() {
  var queue = [],
      variables = new Set(this._updates),
      variable;

  this._computing = null;
  this._updates.clear();

  // Compute the transitive closure of updating variables.
  variables.forEach(function(variable) {
    variable._indegree = 0;
    variable._outputs.forEach(variables.add, variables);
  });

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
    if (variable._outdegree > 0) variable_compute(variable).catch(noop);
    variable._outputs.forEach(postqueue);
    variables.delete(variable);
  }

  // Any remaining variables have circular definitions.
  variables.forEach(function(variable) {
    var error = new ReferenceError("circular definition");
    variable._valuePrior = undefined;
    (variable._value = Promise.reject(error)).catch(noop);
    if (variable._node) variable_displayError(variable, error); // TODO Cleaner?
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
    variable._node.classList.add("result--running");
  }
  var valuePrior = variable._valuePrior;
  return variable._value = Promise.all(variable._inputs.map(variable_value)).then(function(inputs) {
    if (!variable._definition) return Promise.reject(new ReferenceError(variable._name + " is not defined"));
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
    if (variable._node) variable_displayValue(variable, value); // TODO Cleaner?
    return value;
  }, function(error) {
    variable._valuePrior = undefined;
    if (variable._node) variable_displayError(variable, error); // TODO Cleaner?
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
    next.then(function(value) {
      variable._valuePrior = value;
      variable._value = next;
      variable._outputs.forEach(variable._runtime._updates.add, variable._runtime._updates); // TODO Cleaner?
      variable._runtime._compute();
      if (variable._node) variable_displayValue(variable, value); // TODO Cleaner?
      requestAnimationFrame(poll);
      return value;
    }, function(error) {
      variable._valuePrior = undefined;
      variable._value = next;
      variable._outputs.forEach(variable._runtime._updates.add, variable._runtime._updates); // TODO Cleaner?
      variable._runtime._compute();
      if (variable._node) variable_displayError(variable, error); // TODO Cleaner?
      throw error;
    });
  });
}
