import Variable from "../variable/index";

// TODO Move the visible (greedy) flag up to the module?
export default function(visible = true) {
  return new Variable(this, visible);
}
