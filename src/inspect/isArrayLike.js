// TODO https://twitter.com/mbostock/status/702737065121742848
export default function(value) {
  return Array.isArray(value)
      || value instanceof Int8Array
      || value instanceof Int16Array
      || value instanceof Int32Array
      || value instanceof Uint8Array
      || value instanceof Uint8ClampedArray
      || value instanceof Uint16Array
      || value instanceof Uint32Array
      || value instanceof Float32Array
      || value instanceof Float64Array;
}
