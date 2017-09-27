// Symbol do not coerce to strings, they must be explicitly converted.
var symbolToString = Symbol.prototype.toString;

export default function formatSymbol(value) {
  return symbolToString.call(value);
}
