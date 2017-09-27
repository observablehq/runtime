var regExpToString = RegExp.prototype.toString;

export default function formatRegExp(value) {
  return regExpToString.call(value);
}
