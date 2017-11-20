export function variable_delete(variable) {
  variable.delete();
}

export default function() {
  this.define(null, [], undefined);
  this._id = -1; // TODO Better indication of undefined variables?
  return this;
}
