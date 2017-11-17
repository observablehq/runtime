import Module from "../module/index";

export default function() {
  return new Module(this, false);
}

export function runtime_weakModule() {
  return new Module(this, true);
}
