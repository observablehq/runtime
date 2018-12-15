export default function(e) {
  return function() {
    throw e;
  };
}
