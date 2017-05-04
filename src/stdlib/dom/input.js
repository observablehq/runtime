export default function(type) {
  var input = document.createElement("input");
  if (type != null) input.type = type;
  return input;
}
