import {timeFormat} from "d3-time-format";

var formatDay = timeFormat("%Y-%m-%d"),
    formatMinute = timeFormat("%Y-%m-%dT%H:%M"),
    formatSecond = timeFormat("%Y-%m-%dT%H:%M:%S"),
    formatMillisecond = timeFormat("%Y-%m-%dT%H:%M:%S.%L");

export default function formatDate(date) {
  return isNaN(date) ? "Invalid Date"
      : (date.getMilliseconds() ? formatMillisecond
          : date.getSeconds() ? formatSecond
          : date.getMinutes() || date.getHours() ? formatMinute
          : formatDay)(date);
}
