export default function(value) {
  return value
      && typeof value.then === "function";
}
