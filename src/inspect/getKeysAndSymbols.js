// Return an array of all enumerable string keys in an object, followed
// by any enumerable Symbol keys, if there are any
export default function getKeysAndSymbols(value) {
  return Object.keys(value).concat(Object.getOwnPropertySymbols(value)
    .filter(function(key) {
      return Object.prototype.propertyIsEnumerable.call(value, key);
    }));
}
