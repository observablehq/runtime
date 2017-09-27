// Non-integer keys in arrays, e.g. [1, 2, 0.5: "value"].
export default function isArrayIndex(key) {
  return key === (key | 0) + "";
}
