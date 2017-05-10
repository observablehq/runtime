import Variable from "../variable/index";

export default function(node) {
  if (typeof node === "string") node = document.querySelector(node);
  return new Variable(this, node);
}
