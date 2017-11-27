export default function*() {
  while (true) {
    yield Date.now();
  }
}
