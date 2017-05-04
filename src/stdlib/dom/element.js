export default function(uri, name, options) {
  return typeof name === "string"
      ? document.createElementNS(uri, name, options)
      : document.createElement(uri, name);
}
