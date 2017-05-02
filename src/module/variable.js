import Variable from "../variable/index";

export default function(node) {
  return new Variable(this, node);
}
