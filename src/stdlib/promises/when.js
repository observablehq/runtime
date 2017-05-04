import constant from "../../constant";

var timeouts = new Map;

function timeout(now, time) {
  if (!(now < time)) return Promise.reject(new Error("invalid time"));
  var t = new Promise(function(resolve) {
    timeouts.delete(time);
    setTimeout(resolve, time - now);
  });
  timeouts.set(time, t);
  return t;
}

export default function when(time, value) {
  var now;
  return (now = timeouts.get(time = +time)) ? now.then(constant(value))
      : (now = Date.now()) >= time ? Promise.resolve(value)
      : timeout(now, time).then(constant(value));
}
