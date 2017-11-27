export default function() {
  return function*() {
    while (true) {
      yield Date.now();
    }
  };
}
