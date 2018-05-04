// Based on postMessage implementation from: https://github.com/YuzuJS/setImmediate/blob/master/setImmediate.js

let setImmediateFunction;

if (typeof setImmediate === "function") {
  setImmediateFunction = setImmediate;

} else if (typeof postMessage === "function" && typeof addEventListener === "function") {
  let nextHandle = 1;
  let running = false;
  const taskMap = new Map();
  const messagePrefix = "setImmediate$" + Math.random() + "$";

  addEventListener("message", (event) => {
    if (typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
      run(+event.data.slice(messagePrefix.length));
    }
  });

  const postImmediate = (handle) => {
    postMessage(messagePrefix + handle, "*");
  };

  const run = (handle) => {
    if (running) return setTimeout(() => run(handle), 0);
    const task = taskMap.get(handle);
    if (task) {
      running = true;
      try {
        task();
      } finally {
        taskMap.delete(handle);
        running = false;
      }
    }
  };

  setImmediateFunction = (callback) => {
    taskMap.set(nextHandle, callback);
    postImmediate(nextHandle);
    nextHandle++;
  };
}


export default setImmediateFunction;
