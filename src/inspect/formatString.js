/* eslint-disable no-control-regex */

export default function formatString(string, full) {
  if (full) return (count(string, /["\n]/g) <= count(string, /`|\${/g) ? JSON.stringify : templatify)(string);
  if (string.length > 100) string = `${string.slice(0, 50)}…${string.slice(-49)}`;
  return JSON.stringify(string);
}

function templatify(string) {
  return "`" + string.replace(/[\\`\x00-\x09\x0b-\x19]|\${/g, templatifyChar) + "`";
}

function templatifyChar(char) {
  var code = char.charCodeAt(0);
  return code < 0x10 ? "\\x0" + code.toString(16)
      : code < 0x20 ? "\\x" + code.toString(16)
      : "\\" + char;
}

function count(string, re) {
  var n = 0;
  while (re.exec(string)) ++n;
  return n;
}
