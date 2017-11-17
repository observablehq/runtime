import identity from "../identity";

export default function variable_reachable(variable) {
  if (variable._id === -3) return false; // Don’t recompute builtins.
  if (variable._definition !== identity && !variable._module._weak) return true; // Directly reachable.
  var outputs = new Set(variable._outputs);
  for (const output of outputs) {
    if (output._definition !== identity && !output._module._weak) return true; // Indirectly reachable.
    output._outputs.forEach(outputs.add, outputs);
  }
  return false;
}
