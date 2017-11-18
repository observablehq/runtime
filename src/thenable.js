export default function thenable(value) {
  return value
      && typeof value.then === "function";
}
