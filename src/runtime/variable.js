import Variable from "../variable/index";

export default function(moduleId, node) {
  return new Variable(this, moduleId, node);
}
