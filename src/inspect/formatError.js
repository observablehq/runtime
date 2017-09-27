var errorToString = Error.prototype.toString;

export default function formatError(value) {
  return value.stack || errorToString.call(value);
}
