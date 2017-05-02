export default function variable_duplicate(name) {
  return function() {
    throw new ReferenceError(name + " is defined more than once");
  };
}
