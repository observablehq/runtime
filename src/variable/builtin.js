export default function variable_builtin(name) {
  return function() {
    throw new ReferenceError(name + " is a builtin");
  };
}
