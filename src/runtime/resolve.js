import Variable from "../variable/index";

export default function resolve(moduleId, name) {
  var variable = this._scope.get(moduleId + "/" + name) || this._scope.get(name);
  if (!variable) {
    variable = new Variable(this, moduleId);
    variable._name = name;
    this._scope.set(moduleId + "/" + name, variable);
  }
  return variable;
}
