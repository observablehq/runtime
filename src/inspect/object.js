const {getOwnPropertySymbols, prototype: {hasOwnProperty}} = Object;
const {toStringTag} = Symbol;

export const FORBIDDEN = {};

export const symbolsof = getOwnPropertySymbols;

export function isown(object, key) {
  return hasOwnProperty.call(object, key);
}

export function tagof(object) {
  return object[toStringTag]
      || (object.constructor && object.constructor.name)
      || "Object";
}

export function valueof(object, key) {
  try {
    const value = object[key];
    if (value) value.constructor; // Test for SecurityError.
    return value;
  } catch (ignore) {
    return FORBIDDEN;
  }
}
