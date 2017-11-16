// Whenever a variable’s outputs change, we must recompute its outdegree.
export default function variable_outdegree(variable) {
  if (variable._node) return 1;
  var delta,
      outdegree = 0,
      outputs = new Set(variable._outputs),
      inputs;
  outputs.forEach(function(output) {
    if (output._node) ++outdegree;
    output._outputs.forEach(outputs.add, outputs);
  });
  if (delta = outdegree - variable._outdegree) {
    inputs = new Set([variable]);
    inputs.forEach(function(input) {
      input._inputs.forEach(inputs.add, inputs);
      if (input._node) return;
      if (input._outdegree === 0 && delta > 0) input._module._runtime._updates.add(input); // TODO Is this right?
      input._outdegree = Math.max(0, input._outdegree + delta); // TODO I don’t think this is right!
      if (input._outdegree === 0 && delta < 0) if (input._generator) input._generator.return(), input._generator = undefined;
    });
  }
}
