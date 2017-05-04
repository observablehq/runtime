export default function(strings) {
  var string = strings[0] + "", i = 0, n = arguments.length;
  while (++i < n) string += arguments[i] + "" + strings[i];
  var pre = document.createElement("pre"); pre.textContent = string;
  return pre;
}
