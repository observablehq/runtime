function pad(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}

export default function formatDate(date) {
  return isNaN(date) ? "Invalid Date"
      : pad(date.getFullYear(), 4) + "-"
      + pad(date.getMonth() + 1, 2) + "-"
      + pad(date.getDate(), 2)
      + (date.getMilliseconds() ? "T"
          + pad(date.getHours(), 2) + ":"
          + pad(date.getMinutes(), 2) + ":"
          + pad(date.getSeconds(), 2) + "."
          + pad(date.getMilliseconds(), 4)
      : date.getSeconds() ? "T"
          + pad(date.getHours(), 2) + ":"
          + pad(date.getMinutes(), 2) + ":"
          + pad(date.getSeconds(), 2)
      : date.getMinutes() || date.getHours() ? "T"
          + pad(date.getHours(), 2) + ":"
          + pad(date.getMinutes(), 2)
      : "");
}
