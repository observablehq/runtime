export default function Mutable(change, value) {
  Object.defineProperty(this, "value", {
    get: function() {
      return value;
    },
    set: function(x) {
      return change((value = x));
    }
  });
  if (value !== undefined) change(value);
}
