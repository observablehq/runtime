export default function tagof(object) {
  return object[Symbol.toStringTag]
      || (object.constructor && object.constructor.name)
      || "Object";
}
