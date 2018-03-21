const symbolToString = Symbol.prototype.toString;

// Symbols do not coerce to strings; they must be explicitly converted.
export default function formatSymbol(symbol) {
  return symbolToString.call(symbol);
}
